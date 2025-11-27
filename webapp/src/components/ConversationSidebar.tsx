import React from 'react';
import type { Agent, Conversation } from '../api';
import './ConversationSidebar.css';

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

const PenSquareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 16L16.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 16H11L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const AgentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
  } = props;

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

      <div className="sidebar-actions">
        <button className="btn new-chat" onClick={onNewChat} aria-label="新建对话">
          <PenSquareIcon />
          <span>新建对话</span>
        </button>
      </div>

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
            <button
              key={agent.id}
              className={`agent ${currentAgent?.id === agent.id ? 'active' : ''}`}
              onClick={() => onSelectAgent(agent)}
              disabled={!agent.hasKey}
            >
              <AgentIcon />
              <span>{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="conversations">
        <h3>Conversations</h3>
        <ul>
          {convList.map((conv, index) => (
            <li key={`${conv.id}-${index}`} className={currentConvId === conv.id ? 'active' : ''}>
              <button
                className="conv"
                onClick={() => onSelectConversation(conv)}
                aria-label={`打开会话 ${conv.name}`}
              >
                {conv.name}{!currentAgent || currentAgent.id !== conv.agentId ? ` · ${conv.agentName}` : ''}
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
    </aside>
  );
}
