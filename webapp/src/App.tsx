import { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './components/MarkdownRenderer';
import './App.css';
import ConversationSidebar from './components/ConversationSidebar';
import type { Agent, Conversation } from './api';
import { fetchAgents, fetchConversations, fetchMessages, streamChat, deleteConversation, renameConversation, fetchParameters, sendChatBlocking, login, register, setAuthToken, getAuthToken, getAuthUser, logout } from './api';

 

const ArrowUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 12L12 6L18 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MicrophoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="4" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 10C5 13.3137 7.68629 16 11 16H13C16.3137 16 19 13.3137 19 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="21" r="1" fill="currentColor"/>
  </svg>
);

// 回形针图标（附件）
const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 13V7.5C21 5.01472 18.9853 3 16.5 3C14.0147 3 12 5.01472 12 7.5V16C12 17.933 13.567 19.5 15.5 19.5C17.433 19.5 19 17.933 19 16V7" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 7V6.5C12 4.567 10.433 3 8.5 3C6.567 3 5 4.567 5 6.5V15C5 18.038 7.462 20.5 10.5 20.5C13.538 20.5 16 18.038 16 15V7" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ThumbUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 21H6V9H2V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 9L10 3C10.5 2.2 12 2 12 3.5V9H19.5C21 9 21.5 10 21 11.5L19 18C18.6 19.2 17.7 21 16 21H6V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ThumbDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3H6V15H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 15L10 21C10.5 21.8 12 22 12 20.5V15H19.5C21 15 21.5 14 21 12.5L19 6C18.6 4.8 17.7 3 16 3H6V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M8.7 10.6L15.3 7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8.7 13.4L15.3 16.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

 

// 翻页箭头图标
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 重试图标：带箭头的圆圈
const RetryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M16 8L19 8L19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// New type for displaying messages in the UI
// Support AI multi-variant answers for paging
type DisplayMessage = { role: 'user' | 'ai'; text?: string; variants?: string[]; current?: number };
type UIConversation = Conversation & { agentId: string; agentName: string };

// 基于 BASE_URL 构造 public 资源路径，确保子路径部署可用
const BASE_URL: string = import.meta.env.BASE_URL || '/';
const LOGO_URL: string = (BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/') + 'logo.png';
const LOGIN_BG_URL: string = (import.meta.env.VITE_LOGIN_BG as string)
  || ((BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/') + 'login-bg.jpg');

function App() {
  const [authed, setAuthed] = useState<boolean>(!!getAuthToken());
  const [authUser, setAuthUser] = useState<string | null>(getAuthUser());
  const [authError, setAuthError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [answerStarted, setAnswerStarted] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down' | null>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [allConversations, setAllConversations] = useState<UIConversation[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; conv: UIConversation } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{ agentId: string; convId: string } | null>(null);
  const [copied, setCopied] = useState<Record<number, boolean>>({});
  const [parameters, setParameters] = useState<{ user_input_form?: { variable: string; label?: string; required?: boolean; default?: string }[] } | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [renaming, setRenaming] = useState<{ conv: UIConversation; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamMode, setStreamMode] = useState<'send' | 'retry' | null>(null);
  const [retryTarget, setRetryTarget] = useState<number | null>(null);
  // 结束事件处理的防重标记（用于避免 message_end 与 end 双分支重复处理）
  const endHandledRef = useRef<boolean>(false);
  const fallbackAddedRef = useRef<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const convRefreshTimerRef = useRef<number | null>(null);
  const scheduleConvRefresh = (agentId: string) => {
    if (convRefreshTimerRef.current != null) return;
    convRefreshTimerRef.current = window.setTimeout(async () => {
      try {
        const { data } = await fetchConversations(agentId);
        setConversations(data);
      } finally {
        convRefreshTimerRef.current = null;
      }
    }, 500);
  };

  useEffect(() => {
    if (authed) {
      fetchAgents()
        .then((list) => { setAgents(list); setAgentsError(null); })
        .catch(() => { setAgents([]); setAgentsError('load_failed'); });
    } else {
      setAgents([]);
      setAgentsError(null);
    }
  }, [authed]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    if (currentAgent) {
      fetchConversations(currentAgent.id).then(({ data }) => setConversations(data));
      fetchParameters(currentAgent.id)
        .then((p) => {
          setParameters(p);
          const defaults: Record<string, string> = {};
          const form = Array.isArray(p?.user_input_form) ? p.user_input_form : [];
          form.forEach((f) => {
            if (typeof f?.default !== 'undefined') defaults[f.variable] = String(f.default ?? '');
          });
          setInputs(defaults);
        })
        .catch(() => { setParameters(null); setInputs({}); });
      if (!pendingSelection && !currentConvId) {
        setCurrentConvId(null);
        setMessages([]);
      }
    }
  }, [currentAgent]);

  // Load all conversations across agents when agents are available
  useEffect(() => {
    async function loadAll() {
      if (!agents.length) { setAllConversations([]); return; }
      const lists = await Promise.all(
        agents.map(a =>
          fetchConversations(a.id)
            .then(({ data }) => data.map(c => ({ ...c, agentId: a.id, agentName: a.name })))
            .catch(() => [])
        )
      );
      setAllConversations(lists.flat());
    }
    loadAll();
  }, [agents]);

  useEffect(() => {
    if (authed && agents.length && !currentAgent) {
      const next = agents.find(a => a.hasKey);
      if (next) setCurrentAgent(next);
    }
  }, [authed, agents, currentAgent]);

  const refreshAllConversations = async () => {
    if (!agents.length) { setAllConversations([]); return; }
    const lists = await Promise.all(
      agents.map(a =>
        fetchConversations(a.id)
          .then(({ data }) => data.map(c => ({ ...c, agentId: a.id, agentName: a.name })))
          .catch(() => [])
      )
    );
    setAllConversations(lists.flat());
  };

  // After switching agent due to aggregated conversation click, select target conversation
  useEffect(() => {
    if (pendingSelection && currentAgent && currentAgent.id === pendingSelection.agentId) {
      setCurrentConvId(pendingSelection.convId);
      setPendingSelection(null);
    }
  }, [currentAgent, pendingSelection]);

  useEffect(() => {
    // 避免在流式生成过程中拉取历史消息覆盖本地状态，导致“首条消息没反应”
    if (currentAgent && currentConvId && !streaming) {
      fetchMessages(currentAgent.id, currentConvId).then(({ data }) => {
        const msgs: DisplayMessage[] = [];
        data.forEach(m => {
          if (m.query) msgs.push({ role: 'user', text: m.query });
          if (m.answer) msgs.push({ role: 'ai', variants: [m.answer], current: 0 });
        });
        setMessages(msgs);
      });
    }
  }, [currentAgent, currentConvId, streaming]);

  useEffect(() => {
    const end = messagesEndRef.current;
    if (end) {
      // 保持消息容器滚到底部（内部滚动容器）
      end.scrollIntoView({ behavior: streaming ? 'auto' : 'smooth', block: 'end' });
      const scroller = document.querySelector('.chat') as HTMLElement | null;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }
    const prism = (window as unknown as { Prism?: { highlightAllUnder?: (el: Element) => void } }).Prism;
    if (prism?.highlightAllUnder) {
      const container = document.querySelector('.messages');
      if (container) prism.highlightAllUnder(container);
    }
  }, [messages, streaming]);

  // containsCodeBlock 在下文统一定义一次（靠近渲染逻辑）

  // 获取显示文本（支持 AI 多版本）
  const getMessageText = (m: DisplayMessage): string => {
    if (Array.isArray(m.variants)) {
      const idx = m.current ?? 0;
      return m.variants[idx] ?? '';
    }
    return m.text ?? '';
  };
  const getAgentGuide = (ag: Agent | null): { title: string; desc: string; hints: string[] } | null => {
    if (!ag) return null;
    const id = ag.id;
    if (id === 'jiaowu') {
      return { title: '我是智能教务', desc: '我可帮助你查询课程、考试与选课相关信息', hints: ['查询本学期课程安排', '请帮我推荐可选修课程', '查看考试时间与地点'] };
    }
    if (id === 'tuijian') {
      return { title: '我是资源检索与推荐', desc: '我可从海量资源中检索并推荐你需要的内容', hints: ['推荐与机器学习相关的公开课', '搜索最新的教育技术论文', '按主题检索学习资源'] };
    }
    if (id === 'wenxian') {
      return { title: '我是智能文献服务', desc: '我可帮你检索学术文献、整理综述与发现经典作品', hints: ['检索教育评估领域的经典文献', '生成一份文献综述提纲', '查找某作者的代表作'] };
    }
    if (id === 'zhujiao') {
      return { title: '我是智能助教/学伴', desc: '我可协助你制定计划、答疑与学习提醒', hints: ['制定一周学习计划', '线性代数复习的关键点有哪些', '提醒我每天的学习目标'] };
    }
    return { title: ag.name || '智能体', desc: '我可以帮助你解决相关问题', hints: ['我能做什么', '给我一个示例问题', '如何快速开始'] };
  };

  const send = () => {
    if (!currentAgent) return;
    const q = query.trim();
    if (!q) return;

    // Validate required parameters for current agent
    const form = Array.isArray(parameters?.user_input_form) ? parameters!.user_input_form : [];
    const required = form.filter((f) => !!f?.required);
    const missing = required.filter((f) => {
      const v = inputs[f.variable];
      return v == null || String(v).trim() === '';
    });
    if (missing.length) {
      const names = missing.map((f) => f.label || f.variable).join('、');
      setMessages(prev => [...prev, { role: 'ai', text: `请先填写以下参数：${names}` }]);
      return;
    }

    const userMessage: DisplayMessage = { role: 'user', text: q };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    // 发送后将输入框折叠到单行并滚到底部
    const ta = inputRef.current;
    if (ta) {
      ta.rows = 1;
      ta.style.height = 'auto'; // 发送后恢复到最小高度（单行）
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = 0;
      });
    }
    setStreaming(true);
    setAnswerStarted(false);
    setStreamMode('send');
    setRetryTarget(null);
    endHandledRef.current = false;
    fallbackAddedRef.current = false;

    streamChat(
      currentAgent.id,
      {
        query: q,
        inputs: inputs || {},
        conversation_id: currentConvId || undefined,
        user: authUser || undefined,
        auto_generate_name: !currentConvId, // 首次消息自动生成会话名
      },
      event => {
        // 错误处理：兼容显式 error 事件以及仅携带 code/message 的对象
        if ((event?.error) || event.event === 'error' || (event?.code) || (typeof event?.status === 'number' && event.status >= 400)) {
          const raw = event;
          const errMsg = raw?.message || raw?.error || raw?.detail || `HTTP ${raw?.status || ''}` || '未知错误';
          const errCode = raw?.code ? `（${raw.code}）` : '';
          console.error('SSE error:', errMsg);
          setMessages(prev => [...prev, { role: 'ai', text: `抱歉，出错了${errCode}：${errMsg}` }]);
          fallbackAddedRef.current = true; // 已显示错误，不再追加“没有内容”兜底
          setStreaming(false);
          setStreamMode(null);
          return;
        }

        if (event.conversation_id) {
          setCurrentConvId(event.conversation_id);
          if (!conversations.some(c => c.id === event.conversation_id)) {
            const placeholderId = event.conversation_id!;
            setConversations(prev => {
              if (prev.some(c => c.id === placeholderId)) return prev;
              return [{ id: placeholderId, name: '未命名', updated_at: Date.now() }, ...prev];
            });
            scheduleConvRefresh(currentAgent.id);
          }
        }

        if (event.answer != null) {
          const answerText: string = String(event.answer);
          setAnswerStarted(true);
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'ai') {
              // Append to current variant
              if (Array.isArray(last.variants)) {
                const idx = last.current ?? 0;
                const nextVariants = [...last.variants];
                nextVariants[idx] = (nextVariants[idx] || '') + answerText;
                updated[updated.length - 1] = { ...last, variants: nextVariants };
                return updated;
              } else {
                // Convert text to variants first
                updated[updated.length - 1] = { role: 'ai', variants: [ (last.text || '') + answerText ], current: 0 };
                return updated;
              }
            }
            // First chunk: create an AI message with first variant
            return [...updated, { role: 'ai', variants: [answerText], current: 0 }];
          });
        }

        // 显式处理 message_end，兼容上游事件名
        if (event.event === 'message_end') {
          if (endHandledRef.current) return;
          endHandledRef.current = true;
          setStreaming(false);
          setStreamMode(null);
          setRetryTarget(null);
          if (!answerStarted && !fallbackAddedRef.current) {
            // 若未收到任何文本，给出友好提示，避免“没反应”的感知
            setMessages(prev => [...prev, { role: 'ai', text: '这次没有生成可显示的内容。' }]);
            fallbackAddedRef.current = true;
          }
          if (currentAgent) {
            scheduleConvRefresh(currentAgent.id);
          }
          return; // 提前返回，避免在后续 end 分支重复处理
        }

        if (event.event === 'end') {
          if (endHandledRef.current) return;
          endHandledRef.current = true;
          setStreaming(false);
          setStreamMode(null);
          setRetryTarget(null);
          // 流结束后，保险刷新一次会话列表，防止没有返回 conversation_id 时列表不同步
          if (!answerStarted && !fallbackAddedRef.current) {
            // 流直接结束但未产生内容的情况，补充友好提示
            setMessages(prev => [...prev, { role: 'ai', text: '这次没有生成可显示的内容。' }]);
            fallbackAddedRef.current = true;
            // 兜底：发起一次阻塞模式请求，尝试获取完整结果与会话ID
            (async () => {
              try {
                const block = await sendChatBlocking(currentAgent!.id, {
                  query: q,
                  inputs: inputs || {},
                  conversation_id: currentConvId || undefined,
                  auto_generate_name: !currentConvId,
                });
                if ((block?.error) || (block?.code)) {
                  const msg = block?.message || block?.error || '未知错误';
                  const code = block?.code ? `（${String(block.code)}）` : '';
                  setMessages(prev => [...prev, { role: 'ai', text: `抱歉，出错了${code}：${msg}` }]);
                } else if (block && block.answer) {
                  setMessages(prev => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === 'ai') {
                      updated[updated.length - 1] = { role: 'ai', variants: [String(block.answer)], current: 0 };
                    } else {
                      updated.push({ role: 'ai', variants: [String(block.answer)], current: 0 });
                    }
                    return updated;
                  });
                }
                if (block && block.conversation_id) {
                  setCurrentConvId(block.conversation_id);
                  fetchConversations(currentAgent!.id).then(({ data }) => setConversations(data));
                  refreshAllConversations();
                }
              } catch { void 0; }
            })();
          }
          if (currentAgent) {
            scheduleConvRefresh(currentAgent.id);
          }
        }
      }
    );
  };

  // 重试：基于某条 AI 消息之前的最近一条用户输入重新生成回复
  const retryFrom = (aiIndex: number) => {
    if (!currentAgent || streaming) return;
    // 找到该 AI 消息之前最近的用户消息
    let j = aiIndex - 1;
    let userText: string | null = null;
    while (j >= 0) {
      const m = messages[j];
      if (m && m.role === 'user') { userText = getMessageText(m); break; }
      j--;
    }
    if (!userText) {
      // 兜底：使用最后一条用户消息
      for (let k = messages.length - 1; k >= 0; k--) {
        if (messages[k].role === 'user') { userText = getMessageText(messages[k]); break; }
      }
    }
    if (!userText || !userText.trim()) return;

    // 在目标 AI 气泡中新建一个空版本，并切换到该版本；同时截断其后的历史消息
    setMessages(prev => {
      const head = prev.slice(0, aiIndex + 1);
      const target = head[aiIndex];
      if (!target || target.role !== 'ai') return prev;
      const variants = Array.isArray(target.variants) ? [...target.variants] : [(target.text || '')];
      variants.push('');
      head[aiIndex] = { role: 'ai', variants, current: variants.length - 1 };
      return head;
    });

    setStreaming(true);
    setAnswerStarted(false);
    setStreamMode('retry');
    setRetryTarget(aiIndex);
    const targetIdx = aiIndex; // 捕获目标索引，避免闭包读取到旧状态

    streamChat(
      currentAgent.id,
      {
        query: userText,
        inputs: inputs || {},
        conversation_id: currentConvId || undefined,
        auto_generate_name: false,
      },
      event => {
        if ((event?.error) || event.event === 'error') {
          const raw = event;
          const errMsg = raw?.error || raw?.message || raw?.detail || `HTTP ${raw?.status || ''}` || '未知错误';
          console.error('SSE error:', errMsg);
          setMessages(prev => [...prev, { role: 'ai', variants: [`抱歉，出错了：${errMsg}`], current: 0 }]);
          setStreaming(false);
          setStreamMode(null);
          setRetryTarget(null);
          return;
        }

        if (event.conversation_id) {
          setCurrentConvId(event.conversation_id);
          if (!conversations.some(c => c.id === event.conversation_id)) {
            scheduleConvRefresh(currentAgent.id);
          }
        }

        if (event.answer != null) {
          const answerText: string = String(event.answer);
          setAnswerStarted(true);
          setMessages(prev => {
            const updated = [...prev];
            // 写入目标气泡的当前版本（使用本地捕获的索引，避免闭包旧值）
            const msg = updated[targetIdx];
            if (msg && msg.role === 'ai') {
              const idx = msg.current ?? 0;
              const variants = Array.isArray(msg.variants) ? [...msg.variants] : [(msg.text || '')];
              variants[idx] = (variants[idx] || '') + answerText;
              updated[targetIdx] = { role: 'ai', variants, current: idx };
              return updated;
            }
            return updated;
          });
        }

        if (event.event === 'message_end') {
          setStreaming(false);
          setStreamMode(null);
          setRetryTarget(null);
          if (currentAgent) {
            scheduleConvRefresh(currentAgent.id);
          }
          return;
        }

        if (event.event === 'end') {
          setStreaming(false);
          setStreamMode(null);
          setRetryTarget(null);
        }
      }
    );
  };

  // 删除会话：使用统一的 deleteConv 实现

  const deleteConv = async (conv: UIConversation) => {
    await deleteConversation(conv.agentId, conv.id);
    if (currentAgent && currentAgent.id === conv.agentId) {
      setConversations(prev => prev.filter(c => c.id !== conv.id));
    }
    setAllConversations(prev => prev.filter(c => c.id !== conv.id));
    if (currentConvId === conv.id) {
      setCurrentConvId(null);
      setMessages([]);
    }
  };

  const handlePin = () => {
    if (!contextMenu) return;
    setPinned(prev => prev.includes(contextMenu.conv.id) ? prev.filter(id => id !== contextMenu.conv.id) : [contextMenu.conv.id, ...prev]);
    setContextMenu(null);
  };

  const handleRename = () => {
    if (!contextMenu) return;
    setRenaming({ conv: contextMenu.conv, name: contextMenu.conv.name || '' });
  };

  const confirmRename = async () => {
    if (!renaming) return;
    const newName = renaming.name.trim();
    await renameConversation(renaming.conv.agentId, renaming.conv.id, newName, false);
    if (currentAgent && currentAgent.id === renaming.conv.agentId) {
      setConversations(prev => prev.map(c => c.id === renaming.conv.id ? { ...c, name: newName } : c));
    }
    setAllConversations(prev => prev.map(c => c.id === renaming.conv.id ? { ...c, name: newName } : c));
    setRenaming(null);
    setContextMenu(null);
  };

  const newChat = () => {
    setCurrentConvId(null);
    setMessages([]);
  };

  const handleCopy = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (typeof index === 'number') {
        setCopied(prev => ({ ...prev, [index]: true }));
        setTimeout(() => {
          setCopied(prev => ({ ...prev, [index]: false }));
        }, 1200);
      }
    } catch { /* noop */ }
  };

  // 保留：若未来需要判断文本中是否包含代码块，可按需启用

  const convList: UIConversation[] = (
    currentAgent
      ? conversations.map(c => ({ ...c, agentId: currentAgent.id, agentName: currentAgent.name }))
      : allConversations
  )
    .filter(c => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.agentName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (pinned.includes(b.id) ? 1 : 0) - (pinned.includes(a.id) ? 1 : 0));

  if (!authed) {
    return (
      <div
        className="login"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.6) 0%, rgba(17,18,19,0.6) 100%), url('${LOGIN_BG_URL}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="login-box">
          <h2>欢迎使用北京师范大学智思体</h2>
          <div className="field">
            <label>用户名</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="" />
          </div>
          <div className="field">
            <label>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" />
          </div>
          {authError && <div className="error">{authError}</div>}
          <div className="actions">
            <button
              className="btn primary"
              onClick={async () => {
                setAuthError(null);
                const res = await login(username.trim(), password);
                if (res?.token && res?.user) {
                  setAuthToken(res.token, res.user);
                  setAuthed(true);
                  setAuthUser(res.user);
                  setUsername('');
                  setPassword('');
                } else {
                  setAuthError(res?.error ? String(res.error) : '登录失败');
                }
              }}
            >登录</button>
            <button
              className="btn"
              onClick={async () => {
                setAuthError(null);
                const u = username.trim();
                const p = password;
                if (!u || !p) { setAuthError('请填写用户名和密码'); return; }
                const res = await register(u, p);
                if (res?.ok) {
                  const r2 = await login(u, p);
                  if (r2?.token && r2?.user) {
                    setAuthToken(r2.token, r2.user);
                    setAuthed(true);
                    setAuthUser(r2.user);
                    setUsername('');
                    setPassword('');
                  } else {
                    setAuthError('注册成功，但自动登录失败');
                  }
                } else {
                  setAuthError(res?.error ? String(res.error) : '注册失败');
                }
              }}
            >注册并登录</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <ConversationSidebar
        sidebarOpen={sidebarOpen}
        agents={agents}
        currentAgent={currentAgent}
        convList={convList}
        currentConvId={currentConvId}
        pinned={pinned}
        showSearch={showSearch}
        searchTerm={searchTerm}
        onToggleSearch={() => setShowSearch(s => !s)}
        onSearchChange={(term) => setSearchTerm(term)}
        onSelectAgent={(agent) => setCurrentAgent(agent)}
        onNewChat={newChat}
        onSelectConversation={(conv) => {
          if (!currentAgent || currentAgent.id !== conv.agentId) {
            const ag = agents.find(a => a.id === conv.agentId) || null;
            setPendingSelection({ agentId: conv.agentId, convId: conv.id });
            setCurrentAgent(ag);
          } else {
            setCurrentConvId(conv.id);
          }
        }}
        onMore={(conv, rect) => setContextMenu({ x: rect.right, y: rect.bottom, conv })}
        onToggleSidebar={() => setSidebarOpen(s => !s)}
        authUser={authUser}
        onToggleTheme={() => {
          const root = document.documentElement;
          const isDark = root.classList.contains('theme-dark');
          if (isDark) root.classList.remove('theme-dark');
          else root.classList.add('theme-dark');
        }}
        onShowProfile={() => setShowProfile(true)}
      />
      <div className="chat">
        <div className="chat-inner">
          <div className="messages">
          {!messages.length && currentAgent && (
            (() => {
              const guide = getAgentGuide(currentAgent);
              return (
                <div className="guide">
                  <div className="guide-title">{guide?.title || '-'}</div>
                  <div className="guide-desc">{guide?.desc || ''}</div>
                  <div className="guide-hints">
                    {(guide?.hints || []).map((h, idx) => (
                      <button key={idx} onClick={() => { setQuery(h); requestAnimationFrame(() => send()); }}>{h}</button>
                    ))}
                  </div>
                </div>
              );
            })()
          )}
          {!messages.length && !currentAgent && (
            <div className={`empty-state ${(!currentAgent || !agents.some(a => a.hasKey) || !agents.length) ? 'show-tips' : ''}`}>
              <img src={LOGO_URL} alt="logo" />
              {!agents.length && <div className="brand">正在加载...</div>}
              {!!agents.length && !agents.some(a => a.hasKey) && <div className="brand">暂无可用Agent，请联系管理员配置 API Key</div>}
              {!currentAgent && agents.some(a => a.hasKey) && <div className="brand">左侧选择 Agent 即可新建对话</div>}
              {agentsError && <div className="brand">智能体加载失败，请确认服务已启动或网络正常</div>}
            </div>
          )}
          <div className="auth-bar" style={{ display: 'none' }} />
          {messages.map((msg, i) => (
            msg.role === 'user' ? (
              <div key={i} className="message user">
                <div className="user-row">
                  <div className="user-actions left">
                    <button title="复制" onClick={() => handleCopy(getMessageText(msg), i)}><CopyIcon /></button>
                    <button title="编辑" onClick={() => setRenaming({ conv: { id: currentConvId || '', name: getMessageText(msg), agentId: currentAgent?.id || '', agentName: currentAgent?.name || '' }, name: getMessageText(msg) })}><PencilIcon /></button>
                  </div>
                  <div className="bubble user">
                    <MarkdownRenderer text={getMessageText(msg)} verbatim={true} />
                  </div>
                  <div className="user-avatar">U</div>
                </div>
              </div>
            ) : (
              <div key={i} className="message ai">
                <div className="ai-row">
                  <div className="ai-avatar">{currentAgent ? (currentAgent.name?.[0] || 'A') : 'A'}</div>
                  <div className="ai-content">
                    <MarkdownRenderer text={getMessageText(msg)} />
                    {/* 在重试时，针对目标气泡隐藏操作；发送时隐藏最后一条的操作 */}
                    {(() => {
                      const hideActions = streaming && ((streamMode === 'send' && i === messages.length - 1) || (streamMode === 'retry' && i === retryTarget));
                      return !hideActions;
                    })() && (
                      <div className={`ai-actions ${streaming ? 'hidden' : ''}`}>
                        {/* 翻页控件：仅当存在至少两个版本时显示 */}
                        {Array.isArray(msg.variants) && msg.variants.length > 1 && (
                          <>
                            <button
                              title="上一版"
                              disabled={(msg.current ?? 0) <= 0}
                              onClick={() => {
                                setMessages(prev => {
                                  const updated = [...prev];
                                  const m = updated[i];
                                  if (m && m.role === 'ai' && Array.isArray(m.variants)) {
                                    const cur = m.current ?? 0;
                                    updated[i] = { role: 'ai', variants: m.variants, current: Math.max(cur - 1, 0) };
                                  }
                                  return updated;
                                });
                              }}
                            >
                              <ChevronLeftIcon />
                            </button>
                            <span className="pager-index">{((msg.current ?? 0) + 1) + '/' + msg.variants.length}</span>
                            <button
                              title="下一版"
                              disabled={(msg.current ?? 0) >= (msg.variants.length - 1)}
                              onClick={() => {
                                setMessages(prev => {
                                  const updated = [...prev];
                                  const m = updated[i];
                                  if (m && m.role === 'ai' && Array.isArray(m.variants)) {
                                    const cur = m.current ?? 0;
                                    updated[i] = { role: 'ai', variants: m.variants, current: Math.min(cur + 1, m.variants.length - 1) };
                                  }
                                  return updated;
                                });
                              }}
                            >
                              <ChevronRightIcon />
                            </button>
                          </>
                        )}
                        <button
                          title="答的好"
                          className={feedback[i] === 'up' ? 'active' : ''}
                          onClick={() => setFeedback(prev => ({ ...prev, [i]: prev[i] === 'up' ? null : 'up' }))}
                        >
                          <ThumbUpIcon />
                        </button>
                        <button
                          title="不好"
                          className={feedback[i] === 'down' ? 'active' : ''}
                          onClick={() => setFeedback(prev => ({ ...prev, [i]: prev[i] === 'down' ? null : 'down' }))}
                        >
                          <ThumbDownIcon />
                        </button>
                        <button title="重试" disabled={!currentAgent || streaming} onClick={() => retryFrom(i)}>
                          <RetryIcon />
                        </button>
                        <button title="分享" onClick={() => console.log('share', getMessageText(msg))}><ShareIcon /></button>
                        <button title={copied[i] ? '已复制' : '复制'} onClick={() => handleCopy(getMessageText(msg), i)}>
                          {copied[i] ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          ))}
          {/* 仅在发送模式下显示底部加载占位；重试模式不显示，避免双头像 */}
          {streaming && !answerStarted && streamMode === 'send' && (
            <div className="message ai">
              <div className="ai-row">
                <div className="ai-avatar">{currentAgent ? (currentAgent.name?.[0] || 'A') : 'A'}</div>
                <div className="ai-content">
                  <div className="loading-bubble">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          </div>
          <div className="composer">
          {Array.isArray(parameters?.user_input_form) && parameters!.user_input_form.some((f: { required?: boolean }) => !!f?.required) && (
            <div className="param-form">
              {parameters!.user_input_form.filter((f: { required?: boolean }) => !!f?.required).map((f: { variable: string; label?: string; required?: boolean }) => (
                <div key={f.variable} className="param-field">
                  <label>{(f.label || f.variable) + (f.required ? ' *' : '')}</label>
                  <input
                    type="text"
                    value={inputs[f.variable] ?? ''}
                    onChange={e => setInputs(prev => ({ ...prev, [f.variable]: e.target.value }))}
                    placeholder={f.label || f.variable}
                    spellCheck={false}
                    disabled={!currentAgent || streaming}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="composer-box">
            <button
              className="plus-button"
              title="附件"
              disabled={!currentAgent || streaming}
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon />
            </button>
            <textarea
              ref={inputRef}
              rows={1}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onInput={e => {
                // 自动高度：根据内容调整高度，最多显示 6 行，超出使用内部滚动
                const ta = e.currentTarget;
                ta.style.height = 'auto';
                const computedLH = parseFloat(getComputedStyle(ta).lineHeight);
                const lh = isNaN(computedLH) ? 22 : computedLH;
                const maxH = Math.max(lh * 6, 120);
                ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    // Shift+Enter: 插入换行
                    e.preventDefault();
                    const ta = e.currentTarget;
                    const start = ta.selectionStart ?? query.length;
                    const end = ta.selectionEnd ?? query.length;
                    const next = query.slice(0, start) + '\n' + query.slice(end);
                    setQuery(next);
                    // 下一帧设置光标位置到插入后的换行后
                    requestAnimationFrame(() => {
                      ta.selectionStart = ta.selectionEnd = start + 1;
                    });
                  } else {
                    // Enter: 发送
                    e.preventDefault();
                    send();
                  }
                }
              }}
              placeholder="尽管问..."
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              disabled={!currentAgent || streaming}
            />
            <button className="icon-button" title="语音" disabled={!currentAgent || streaming}><MicrophoneIcon /></button>
            <button className="send-button" onClick={send} disabled={!currentAgent || streaming || !query.trim()}>
              <ArrowUpIcon />
            </button>
            {/* 隐藏的文件输入框，用于触发上传 */}
            <input
              type="file"
              multiple
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                // 先以占位符形式反馈选中文件名，后续可接入后端上传
                const names = files.map(f => f.name).join(', ');
                setMessages(prev => [...prev, { role: 'ai', text: `已选择文件：${names}` }]);
                e.currentTarget.value = '';
              }}
            />
          </div>
          <div className="composer-note">该版本智思体尚在测试之中，回答未必准确</div>
          </div>
        </div>
      </div>
      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          {renaming ? (
            <div className="rename-form" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={renaming.name}
                onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                placeholder="输入新的会话名称"
                spellCheck={false}
                style={{ width: '200px', padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: 6 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={confirmRename}>保存</button>
                <button onClick={() => setRenaming(null)}>取消</button>
              </div>
            </div>
          ) : (
            <>
              <button onClick={handlePin}>置顶/取消置顶</button>
              <button onClick={handleRename}>重命名</button>
              <button onClick={() => { deleteConv(contextMenu.conv); setContextMenu(null); }}>删除</button>
            </>
          )}
        </div>
      )}
      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowProfile(false)}>
          <div style={{ width: 420, background: 'var(--main-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>用户信息</h3>
              <button className="icon-button" onClick={() => setShowProfile(false)}>×</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <div className="user-avatar">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M4 21c0-4.4183 3.5817-8 8-8s8 3.5817 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>{authUser || '-'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已登录</div>
              </div>
              <button
                className="btn"
                onClick={() => {
                  setShowProfile(false);
                  logout();
                  setAuthed(false);
                  setAuthUser(null);
                  setAgents([]);
                  setCurrentAgent(null);
                  setConversations([]);
                  setMessages([]);
                }}
              >切换用户</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
