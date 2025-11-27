const SERVER_BASE = (import.meta.env.VITE_SERVER_BASE as string) || 'http://localhost:3000';

export type Agent = { id: string; name: string; hasKey: boolean };
export type Conversation = { id: string; name: string; updated_at?: number };
export type Message = {
  id: string;
  conversation_id: string;
  query?: string;
  answer?: string;
  created_at?: number;
};

export async function fetchAgents(): Promise<Agent[]> {
  const resp = await fetch(`${SERVER_BASE}/api/agents`);
  const data = await resp.json();
  return data.data || [];
}

export async function fetchConversations(agentId: string, userId: string): Promise<{ data: Conversation[]; has_more: boolean }>{
  const url = new URL(`${SERVER_BASE}/api/${agentId}/conversations`);
  url.searchParams.set('user', userId);
  const resp = await fetch(url);
  return await resp.json();
}

export async function fetchMessages(agentId: string, conversationId: string, userId: string): Promise<{ data: Message[] }>{
  const url = new URL(`${SERVER_BASE}/api/${agentId}/messages`);
  url.searchParams.set('conversation_id', conversationId);
  url.searchParams.set('user', userId);
  const resp = await fetch(url);
  return await resp.json();
}

export type ChatBody = {
  inputs: Record<string, any>; // Ensure inputs is always present
  query: string;
  conversation_id?: string;
  user: string;
  auto_generate_name?: boolean;
};

export type ChatEvent = {
  event?: string;
  answer?: string;
  conversation_id?: string;
  id?: string;
  message_id?: string;
  error?: string;
};

export async function streamChat(
  agentId: string,
  body: ChatBody,
  onEvent: (ev: ChatEvent) => void,
): Promise<{ abort: () => void }>{
  const controller = new AbortController();
  let resp: Response;
  try {
    resp = await fetch(`${SERVER_BASE}/api/${agentId}/chat-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    try { onEvent({ error: 'network_error', message: String(e) } as any); } catch {}
    try { onEvent({ event: 'end' } as any); } catch {}
    return { abort: () => controller.abort() };
  }

  const ct = resp.headers.get('content-type') || '';
  // Handle non-OK or non-SSE response by emitting a single event
  if (!resp.ok || !ct.includes('text/event-stream')) {
    let text = '';
    try { text = await resp.text(); } catch {}
    try {
      const obj = text ? JSON.parse(text) : {};
      onEvent(obj as any);
    } catch {
      onEvent({ error: 'http_error', status: resp.status, body: text } as any);
    }
    try { onEvent({ event: 'end' } as any); } catch {}
    return { abort: () => controller.abort() };
  }

  const reader = (resp.body as ReadableStream)?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  async function pump() {
    if (!reader) return;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE events separated by double newlines
      const parts = buffer.split(/\n\n/);
      buffer = parts.pop() || '';
      for (const part of parts) {
        const lines = part.split(/\n/);
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const jsonStr = line.replace(/^data:\s*/, '');
            try {
              const ev = JSON.parse(jsonStr);
              onEvent(ev);
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    }
    // Signal end to consumer when stream closes
    try { onEvent({ event: 'end' } as any); } catch {}
  }
  pump();
  return { abort: () => controller.abort() };
}

export async function deleteConversation(agentId: string, conversationId: string, userId: string) {
  const resp = await fetch(`${SERVER_BASE}/api/${agentId}/conversations/${conversationId}?user=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  return resp.status === 204;
}

export async function fetchParameters(agentId: string): Promise<any> {
  const resp = await fetch(`${SERVER_BASE}/api/${agentId}/parameters`);
  return await resp.json();
}

export async function fetchSuggested(agentId: string, messageId: string, userId: string): Promise<string[]> {
  const url = new URL(`${SERVER_BASE}/api/${agentId}/messages/${messageId}/suggested`);
  url.searchParams.set('user', userId);
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data || [];
}

export async function renameConversation(agentId: string, conversationId: string, name: string | undefined, autoGenerate: boolean, userId: string) {
  const resp = await fetch(`${SERVER_BASE}/api/${agentId}/conversations/${conversationId}/name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name || '', auto_generate: !!autoGenerate, user: userId }),
  });
  return await resp.json();
}

export function getOrCreateUserId(): string {
  const k = 'chat_user_id';
  let id = localStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(k, id);
  }
  return id;
}