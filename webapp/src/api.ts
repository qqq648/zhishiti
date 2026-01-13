const SERVER_BASE = (import.meta.env.VITE_SERVER_BASE as string) || 'http://localhost:3003';
let AUTH_TOKEN: string | null = (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null);
let AUTH_USER: string | null = (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_user') : null);

export function setAuthToken(token: string, user: string) {
  AUTH_TOKEN = token;
  AUTH_USER = user;
  try {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', user);
  } catch { void 0; }
}
export function getAuthToken(): string | null {
  return AUTH_TOKEN;
}
export function getAuthUser(): string | null {
  return AUTH_USER;
}
export function logout() {
  AUTH_TOKEN = null;
  AUTH_USER = null;
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  } catch { void 0; }
}

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
  const resp = await fetch(`${SERVER_BASE}/api/agents`, {
    headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : undefined,
  });
  const data = await resp.json();
  return data.data || [];
}

export async function fetchConversations(agentId: string): Promise<{ data: Conversation[]; has_more: boolean }>{
  const url = new URL(`${SERVER_BASE}/api/${agentId}/conversations`);
  const resp = await fetch(url, {
    headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : undefined,
  });
  return await resp.json();
}

export async function fetchMessages(agentId: string, conversationId: string): Promise<{ data: Message[] }>{
  const url = new URL(`${SERVER_BASE}/api/${agentId}/messages`);
  url.searchParams.set('conversation_id', conversationId);
  const resp = await fetch(url, {
    headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : undefined,
  });
  return await resp.json();
}

export type ChatBody = {
  inputs: Record<string, unknown>;
  query: string;
  conversation_id?: string;
  user?: string;
  auto_generate_name?: boolean;
};

export type ChatEvent = {
  event?: string;
  answer?: string;
  conversation_id?: string;
  id?: string;
  message_id?: string;
  error?: string;
  code?: string | number;
  status?: number;
  message?: string;
  detail?: string;
  body?: string;
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
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    try { onEvent({ error: 'network_error', message: String(e instanceof Error ? e.message : String(e)) }); } catch { void 0; }
    try { onEvent({ event: 'end' }); } catch { void 0; }
    return { abort: () => controller.abort() };
  }

  const ct = resp.headers.get('content-type') || '';
  // Handle non-OK or non-SSE response by emitting a single event
  if (!resp.ok || !ct.includes('text/event-stream')) {
    let text = '';
    try { text = await resp.text(); } catch { void 0; }
    try {
      const obj = text ? (JSON.parse(text) as ChatEvent) : ({} as ChatEvent);
      onEvent(obj);
    } catch {
      onEvent({ error: 'http_error', status: resp.status, body: text });
    }
    try { onEvent({ event: 'end' }); } catch { void 0; }
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
              const ev = JSON.parse(jsonStr) as ChatEvent;
              onEvent(ev);
            } catch { void 0; }
          }
        }
      }
    }
    // Signal end to consumer when stream closes
    try { onEvent({ event: 'end' }); } catch { void 0; }
  }
  pump();
  return { abort: () => controller.abort() };
}

// 兜底：阻塞模式请求完整回复和会话 ID
export async function sendChatBlocking(
  agentId: string,
  body: ChatBody,
): Promise<ChatEvent>{
  const resp = await fetch(`${SERVER_BASE}/api/${agentId}/chat-messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
    },
    body: JSON.stringify({ ...body, response_mode: 'blocking' }),
  });
  try {
    const json = await resp.json();
    return json as ChatEvent;
  } catch {
    return { error: 'http_error', status: resp.status, message: 'parse_error' };
  }
}

export async function deleteConversation(agentId: string, conversationId: string) {
  const resp = await fetch(`${SERVER_BASE}/api/${agentId}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : undefined,
  });
  return resp.status === 204;
}

export type UserInputField = { variable: string; label?: string; required?: boolean; default?: string };
export type AgentParameters = { user_input_form?: UserInputField[] };
export async function fetchParameters(agentId: string): Promise<AgentParameters> {
  const resp = await fetch(`${SERVER_BASE}/api/${agentId}/parameters`, {
    headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : undefined,
  });
  return await resp.json();
}

export async function fetchSuggested(agentId: string, messageId: string): Promise<string[]> {
  const url = new URL(`${SERVER_BASE}/api/${agentId}/messages/${messageId}/suggested`);
  const resp = await fetch(url, {
    headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : undefined,
  });
  const json = await resp.json();
  return json.data || [];
}

export async function renameConversation(agentId: string, conversationId: string, name: string | undefined, autoGenerate: boolean) {
  const resp = await fetch(`${SERVER_BASE}/api/${agentId}/conversations/${conversationId}/name`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
    },
    body: JSON.stringify({ name: name || '', auto_generate: !!autoGenerate }),
  });
  return await resp.json();
}

export async function login(username: string, password: string): Promise<{ token?: string; user?: string; error?: string }> {
  const resp = await fetch(`${SERVER_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  try {
    return await resp.json();
  } catch {
    return { error: 'http_error' };
  }
}
export async function register(username: string, password: string): Promise<{ ok?: boolean; error?: string }> {
  const resp = await fetch(`${SERVER_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  try {
    return await resp.json();
  } catch {
    return { error: 'http_error' };
  }
}
