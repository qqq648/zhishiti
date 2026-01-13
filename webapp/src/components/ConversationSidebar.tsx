import { useState } from 'react';
import type { Agent, Conversation } from '../api';
import './ConversationSidebar.css';
import iconJiaowu from '../../picture/教务.svg';
import iconTuijian from '../../picture/检索.svg';
import iconZhujiao from '../../picture/助教.svg';
import iconWenxian from '../../picture/文献.svg';

export type UIConversation = Conversation & { agentId: string; agentName: string };

type Props = {
  sidebarOpen: boolean;
  agents: Agent[];
  currentAgent: Agent | null;
  convList: UIConversation[];
  currentConvId: string | null;
  pinned: string[];
  showSearch: boolean;
  searchTerm: string;
  onToggleSearch: () => void;
  onSearchChange: (term: string) => void;
  onSelectAgent: (agent: Agent) => void;
  onNewChat: () => void;
  onSelectConversation: (conv: UIConversation) => void;
  onMore: (conv: UIConversation, rect: DOMRect) => void;
  onToggleSidebar: () => void;
  authUser?: string | null;
  onToggleTheme?: () => void;
  onShowProfile?: () => void;
};

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);



const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="12" r="2" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <circle cx="19" cy="12" r="2" fill="currentColor"/>
  </svg>
);

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3L16 11L13 14L10 11L8 13L5 10L8 7L5 4L8 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 14L11 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function ConversationSidebar(props: Props) {
  const {
    agents,
    currentAgent,
    convList,
    currentConvId,
    pinned,
    showSearch,
    searchTerm,
    onToggleSearch,
    onSearchChange,
    onSelectAgent,
    onNewChat,
    onSelectConversation,
    onMore,
    onToggleSidebar,
    authUser,
    onToggleTheme,
    onShowProfile,
  } = props;

  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'jiaowu': return iconJiaowu;
      case 'tuijian': return iconTuijian;
      case 'zhujiao': return iconZhujiao;
      case 'wenxian': return iconWenxian;
      default: return iconJiaowu;
    }
  };

  return (
    <aside className="sidebar" aria-label="对话侧栏">
      <div className="sidebar-header">
        <button className="menu-button" onClick={onToggleSidebar} aria-label="切换侧栏">
          <MenuIcon />
        </button>
        <button className="icon-button" onClick={onToggleSearch} title="搜索" aria-label="搜索">
          <SearchIcon />
        </button>
      </div>

      {/* 移除顶栏的新建对话按钮；改为在 Agent 项上提供新建入口 */}

      {showSearch && (
        <div className="sidebar-search">
          <input
            placeholder="搜索会话或Agent"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      <div className="agents">
        <h3>Agents</h3>
        <div className="agent-list">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`agent-item ${expandedAgentId === agent.id ? 'expanded' : ''}`}
              onMouseLeave={() => setExpandedAgentId(null)}
            >
              <button
                className="agent"
                onClick={() => { onSelectAgent(agent); setExpandedAgentId(agent.id); }}
                disabled={!agent.hasKey}
              >
                <img className="agent-icon" src={getAgentIcon(agent.id)} alt={agent.name} />
                <span>{agent.name}</span>
              </button>
              {agent.hasKey && expandedAgentId === agent.id && (
                <div className="agent-actions" aria-hidden={expandedAgentId !== agent.id}>
                  <button
                    className="new-chat"
                    title="新建对话"
                    onClick={() => { onSelectAgent(agent); onNewChat(); setExpandedAgentId(null); }}
                  >
                    新建对话
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="conversations">
        <h3>Conversations</h3>
        <ul>
          {convList.map((conv) => (
            <li key={conv.id} className={currentConvId === conv.id ? 'active' : ''}>
              <button
                className="conv"
                onClick={() => onSelectConversation(conv)}
                aria-label={`打开会话 ${conv.name}`}
              >
                {(conv.name || '未命名')}{!currentAgent || currentAgent.id !== conv.agentId ? ` · ${conv.agentName}` : ''}
              </button>
              <div className="conv-actions" aria-hidden={!pinned.includes(conv.id)}>
                {pinned.includes(conv.id) && (
                  <button className="pin-indicator" title="已置顶" aria-label="已置顶"><PinIcon /></button>
                )}
                <button
                  className="more"
                  title="更多"
                  aria-label="更多操作"
                  onClick={(e) => {
                    // 阻止事件冒泡到 document 的全局点击关闭逻辑
                    e.stopPropagation();
                    onMore(conv, (e.currentTarget as HTMLButtonElement).getBoundingClientRect());
                  }}
                >
                  <DotsIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="sidebar-footer">
        <button className="icon-button" title="切换主题" onClick={onToggleTheme} aria-label="切换主题">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="user-avatar" title="用户信息" onClick={onShowProfile} aria-label="用户信息">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M4 21c0-4.4183 3.5817-8 8-8s8 3.5817 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <span className="sidebar-user">{authUser || '-'}</span>
      </div>
    </aside>
  );
}
