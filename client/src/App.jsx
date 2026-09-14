import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Sparkles, Loader2, Copy, Check, Download, Play, User, MoreVertical, Plus, Trash2, Code2, Sun, Moon, Code, LogOut, Menu, ChevronUp, Library, Bookmark, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import GettingStarted from './GettingStarted';
import Login from './components/Login';
import Profile from './components/Profile';
import Snippets from './components/Snippets';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdateToast from './components/PWAUpdateToast';
import { fetchApi } from './utils/api';
import logoImage from './assets/logo.png';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const ChatInput = ({ isLoading, programmingLanguage, setProgrammingLanguage, onSubmit }) => {
  const [input, setInput] = useState('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setIsLangMenuOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const languages = ['Python', 'JavaScript', 'HTML/CSS', 'Modern Game'];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit(input);
        setInput('');
      }
    }
  };

  const handleSubmitClick = () => {
    if (!isLoading && input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <div className="input-footer">
      <div className="prompt-input-container-v3">
        <textarea
          className="prompt-textarea-v3"
          placeholder="Message AI CodeGen..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="controls-row-v3">
          <div className="custom-lang-selector" onClick={(e) => e.stopPropagation()}>
            <button
              className="lang-selector-btn"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            >
              <Code2 size={14} />
              <span>{programmingLanguage}</span>
              <ChevronUp size={14} className={`chevron ${isLangMenuOpen ? 'open' : ''}`} />
            </button>

            <AnimatePresence>
              {isLangMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="lang-dropdown-menu"
                >
                  <div className="lang-dropdown-header">Select Language</div>
                  <div className="lang-dropdown-list">
                    {languages.map(lang => (
                      <button
                        key={lang}
                        className={`lang-option ${programmingLanguage === lang ? 'selected' : ''}`}
                        onClick={() => {
                          setProgrammingLanguage(lang);
                          setIsLangMenuOpen(false);
                        }}
                      >
                        {lang}
                        {programmingLanguage === lang && <Check size={14} className="check-icon" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            className="generate-btn"
            onClick={handleSubmitClick}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <Loader2 size={18} className="spin-slow" /> : <Send size={16} />}
            <span className="send-text">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [view, setView] = useState(() => localStorage.getItem('auth_token') ? 'dashboard' : 'landing'); // 'landing', 'login', 'dashboard'
  const [loginMode, setLoginMode] = useState('login');
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [chats, setChats] = useState([]); // List of chat sessions from backend
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]); // Messages for the active chat

  const [promptType, setPromptType] = useState('code');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [savingSnippetId, setSavingSnippetId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [programmingLanguage, setProgrammingLanguage] = useState('Python');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const [menuOpenChatId, setMenuOpenChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenChatId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Effect for theme
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Fetch chats on mount if logged in
  useEffect(() => {
    if (token && view === 'dashboard') {
      fetchChats();
    }
  }, [token, view]);

  const fetchChats = async () => {
    try {
      const res = await fetchApi('/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (e) {
      console.error("Failed to fetch chats", e);
    }
  };

  const loadChat = async (chatId) => {
    if (isLoading) return;
    setCurrentChatId(chatId);
    setMessages([]);
    try {
      const res = await fetchApi(`/chats/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.current_language) {
          setProgrammingLanguage(data.current_language);
        }
      }
    } catch (e) {
      console.error("Failed to load chat", e);
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    try {
      const res = await fetchApi(`/chats/${chatId}`, { method: 'DELETE' });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
          startNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  const handleRenameChat = async (chatId) => {
    if (!editTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      const res = await fetchApi(`/chats/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editTitle.trim() })
      });
      if (res.ok) {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: editTitle.trim() } : c));
      }
    } catch (err) {
      console.error('Failed to rename chat', err);
    }
    setEditingChatId(null);
  };

  const getGroupedChats = () => {
    const groups = {
      'Today': [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = today - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;

    chats.forEach(chat => {
      const chatDate = new Date(chat.createdAt || chat.created_at).getTime();
      if (chatDate >= today) groups['Today'].push(chat);
      else if (chatDate >= sevenDaysAgo) groups['Previous 7 Days'].push(chat);
      else if (chatDate >= thirtyDaysAgo) groups['Previous 30 Days'].push(chat);
      else groups['Older'].push(chat);
    });

    return groups;
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setChats([]);
    setMessages([]);
    setCurrentChatId(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const handleSubmit = async (userInputValue) => {
    if (!userInputValue.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: userInputValue.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage('');

    let currentType = 'code';
    if (programmingLanguage === 'HTML/CSS') {
      currentType = 'ui';
    } else if (programmingLanguage === 'Modern Game') {
      currentType = 'game';
    }

    try {
      const response = await fetchApi('/chats', {
        method: 'POST',
        body: JSON.stringify({
          chatId: currentChatId,
          content: userInputValue.trim(),
          lang: programmingLanguage,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 403 && errData.error === 'LIMIT_REACHED') {
           setShowSettingsModal(true);
           throw new Error('Daily limit reached. Please enter your Gemini API key in Settings.');
        }
        if (response.status === 401 || response.status === 403) handleLogout();
        throw new Error('Failed to connect to the server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let isNewChat = !currentChatId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const dataStr = trimmedLine.replace(/^data: /, '').trim();
          if (dataStr === '[DONE]') break;

          try {
            const data = JSON.parse(dataStr);
            if (data.meta && data.meta.chatId) {
              setCurrentChatId(data.meta.chatId);
              isNewChat = true;
            } else if (data.content) {
              assistantMessage += data.content;
              setStreamingMessage(assistantMessage);
            } else if (data.error) {
              throw new Error(data.details || data.error);
            }
          } catch (e) {
            console.error('SSE Parse Error:', e);
          }
        }
      }

      const finalAssistantMessage = {
        role: 'assistant',
        content: assistantMessage,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, finalAssistantMessage]);
      setStreamingMessage('');
      setIsLoading(false);

      if (isNewChat) {
        fetchChats(); // Refresh sidebar to show the new chat
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { role: 'assistant', content: `Error: ${error.message}` };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const getCodeBlocks = (content) => {
    const codeBlocks = [];
    const regex = /```(\w+)?\s?\n?([\s\S]*?)```/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      codeBlocks.push({ lang: m[1]?.toLowerCase(), code: m[2] });
    }
    return codeBlocks;
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (code, lang) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-code.${lang || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = (code, lang) => {
    if (!code) return;
    const combined = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>body { font-family: sans-serif; padding: 20px; }</style>
        </head>
        <body>
          ${lang === 'html' ? code : `<pre>${code}</pre>`}
          ${lang === 'javascript' || lang === 'js' ? `<script>${code}</script>` : ''}
        </body>
      </html>
    `;
    const blob = new Blob([combined], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };


  const getExplanationOnly = (content) => {
    if (!content) return "";
    return content.replace(/```(\w+)?\s?\n?([\s\S]*?)```/g, "").trim();
  };

  const handleSaveSnippet = async (codeContent, language, messageId, key) => {
    try {
      setSavingSnippetId(`save-${key}`);
      const title = `Saved Snippet - ${language}`;
      const res = await fetchApi('/snippets', {
        method: 'POST',
        body: JSON.stringify({ codeContent, language, messageId, title })
      });
      if (res.ok) {
        setCopiedId(`saved-${key}`);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSnippetId(null);
    }
  };

  const renderAIResponse = (content, index, msgId) => {
    if (!content) return null;
    const codeBlocks = getCodeBlocks(content);
    const hasCode = codeBlocks.length > 0;
    const explanation = getExplanationOnly(content);
    const key = index !== undefined ? index : 'streaming';

    return (
      <div key={key} className="ai-response-container">
        {hasCode && (
          <div className="ui-card">
            <div className="output-header">
              <h2 className="output-title">Generated Code</h2>
            </div>
            <div className="code-result-v2">
              <div className="code-header-v2">
                <span className="code-lang">{codeBlocks[0].lang || programmingLanguage}</span>
                <div className="code-actions-top">
                  <button
                    className="action-btn-v2"
                    onClick={() => handleCopy(codeBlocks[0].code, `copy-${key}`)}
                  >
                    {copiedId === `copy-${key}` ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === `copy-${key}` ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    className="action-btn-v2"
                    onClick={() => handleSaveSnippet(codeBlocks[0].code, codeBlocks[0].lang || programmingLanguage, msgId, key)}
                    disabled={savingSnippetId === `save-${key}`}
                  >
                    {copiedId === `saved-${key}` ? <Check size={14} /> : <Bookmark size={14} />}
                    <span>{copiedId === `saved-${key}` ? 'Saved Snippet' : 'Save Snippet'}</span>
                  </button>
                  <button
                    className="action-btn-v2"
                    onClick={() => handleDownload(codeBlocks[0].code, codeBlocks[0].lang)}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                  <button
                    className="action-btn-v2 primary"
                    onClick={() => handleRun(codeBlocks[0].code, codeBlocks[0].lang)}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Run Code</span>
                  </button>
                </div>
              </div>
              <div className="code-body-v3">
                <SyntaxHighlighter
                  language={codeBlocks[0].lang || programmingLanguage.toLowerCase()}
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  customStyle={{ margin: 0, padding: '20px', fontSize: '14px', background: 'transparent' }}
                >
                  {codeBlocks[0].code}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}

        {explanation && (
          <div className="ui-card explanation-card">
            <label className="card-label">Code Explanation</label>
            <div className="markdown-content-v2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (view === 'landing') {
    return <GettingStarted
      user={user}
      onDashboard={() => setView('dashboard')}
      onGetStarted={() => {
        if (token) setView('dashboard');
        else {
          setLoginMode('login');
          setView('login');
        }
      }}
      onLogin={() => {
        if (token) setView('dashboard');
        else {
          setLoginMode('login');
          setView('login');
        }
      }}
    />;
  }

  if (view === 'login') {
    return <Login
      initialMode={loginMode}
      onLoginSuccess={(newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        setView('dashboard');
      }}
      onBack={() => setView('landing')}
    />;
  }

  return (
    <div className="app-wrapper">
      <header className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={20} />
          </button>
          <img src={logoImage} alt="AI CodeGen" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }} />
          <h1 className="logo-text">AI CodeGen</h1>
        </div>

        <div className="top-right-actions">
          <button 
            className="theme-toggle-v2" 
            onClick={() => {
              localStorage.removeItem('pwa_prompt_dismissed');
              localStorage.removeItem('pwa_ios_prompt_dismissed');
              window.dispatchEvent(new Event('beforeinstallprompt'));
              window.location.reload();
            }} 
            title="Install App / PWA Info"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: 500, borderRadius: '8px' }}
          >
            <Download size={16} />
            <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>App</span>
          </button>
          <button className="theme-toggle-v2" onClick={() => setShowSettingsModal(true)} title="Settings">
            <Settings size={20} />
          </button>
          <button className="theme-toggle-v2" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Dark Mode">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="user-profile" title="Account Settings" onClick={() => setView('profile')} style={{ cursor: 'pointer' }}>
            <div className="user-avatar-placeholder" style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 'bold', fontSize: '18px', cursor: 'pointer'
              }}>
                {(user?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {isSidebarOpen && <div className="sidebar-overlay visible" onClick={() => setIsSidebarOpen(false)}></div>}

        <aside className={`panel-left ${isSidebarOpen ? 'open' : ''}`}>
          <div className="ui-card history-container" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label className="card-label" style={{ marginBottom: 0 }}>Your Chat History</label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => { startNewChat(); setView('dashboard'); setIsSidebarOpen(false); }} className="new-chat-btn" style={{ flex: 1, margin: 0 }} title="New Chat">
                <Plus size={16} />
                <span>New Chat</span>
              </button>
              <button onClick={() => { setView('snippets'); setIsSidebarOpen(false); }} className="new-chat-btn" style={{ flex: 1, margin: 0, backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }} title="My Snippets">
                <Library size={16} />
                <span>Library</span>
              </button>
            </div>
            <div className="history-list">
              {chats.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No chats yet. Try generating some code!
                </div>
              ) : (
                Object.entries(getGroupedChats()).map(([groupName, groupChats]) => {
                  if (groupChats.length === 0) return null;
                  return (
                    <div key={groupName} className="history-group">
                      <div className="history-group-label">{groupName}</div>
                      {groupChats.map((chat) => (
                        <div
                          key={chat.id}
                          className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
                          onClick={() => {
                            if (editingChatId !== chat.id) {
                              loadChat(chat.id);
                              setView('dashboard');
                              setIsSidebarOpen(false);
                            }
                          }}
                        >
                          {editingChatId === chat.id ? (
                            <input
                              type="text"
                              className="chat-rename-input"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={() => handleRenameChat(chat.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameChat(chat.id);
                                if (e.key === 'Escape') setEditingChatId(null);
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="history-text" title={chat.title}>{chat.title || 'New Chat'}</span>
                          )}

                          {editingChatId !== chat.id && (
                            <div className="chat-menu-container" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="icon-btn-menu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenChatId(menuOpenChatId === chat.id ? null : chat.id);
                                }}
                              >
                                <MoreVertical size={14} />
                              </button>

                              <AnimatePresence>
                                {menuOpenChatId === chat.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="chat-dropdown-menu"
                                  >
                                    <button onClick={(e) => {
                                      e.stopPropagation();
                                      setEditTitle(chat.title || 'New Chat');
                                      setEditingChatId(chat.id);
                                      setMenuOpenChatId(null);
                                    }}>Change Name</button>
                                    <button className="danger" onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteChat(e, chat.id);
                                      setMenuOpenChatId(null);
                                    }}>Delete</button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => { setView('profile'); setIsSidebarOpen(false); }} className={`history-item ${view === 'profile' ? 'active' : ''}`} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', margin: 0, border: 'none' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                  {user?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{user?.display_name || 'User'}</div>
                </div>
              </button>
              <button onClick={handleLogout} className="icon-btn-menu" style={{ padding: '8px', opacity: 1 }} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        <section className="panel-right">
          {view === 'profile' ? (
            <Profile user={user} setUser={setUser} onLogout={handleLogout} onBack={() => setView('dashboard')} />
          ) : view === 'snippets' ? (
            <Snippets user={user} onBack={() => setView('dashboard')} />
          ) : (
            <>
              <div className="chat-feed-wrapper">
                {!messages.length && !isLoading && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', gap: '16px', minHeight: '400px' }}>
                    <img src={logoImage} alt="AI CodeGen" style={{ width: '80px', height: '80px', opacity: 0.8, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <div>
                      <h2 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Ready to Code</h2>
                      <p>Describe your needs in the input box below and I'll generate the solution here.</p>
                    </div>
                  </div>
                )}

                <div className="chat-feed">
                  {messages.map((msg, index) => {
                    if (msg.role === 'user') {
                      return (
                        <div key={index} className="user-prompt-card">
                          <div className="user-prompt-header">
                            <User size={14} /> <span>You</span>
                          </div>
                          <div className="user-prompt-text">{msg.content}</div>
                        </div>
                      );
                    } else {
                      return renderAIResponse(msg.content, index, msg.id);
                    }
                  })}

                  {isLoading && streamingMessage && renderAIResponse(streamingMessage)}
                  {isLoading && !streamingMessage && (
                    <div className="ui-card ai-response-container">
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="shimmer-line" style={{ width: '80%' }} />
                        <div className="shimmer-line" style={{ width: '60%' }} />
                        <div className="shimmer-line" style={{ width: '70%' }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} style={{ height: 1 }} />
                </div>
              </div>

              <ChatInput
                isLoading={isLoading}
                programmingLanguage={programmingLanguage}
                setProgrammingLanguage={setProgrammingLanguage}
                onSubmit={handleSubmit}
              />
            </>
          )}
        </section>
      </main>

      {showSettingsModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid var(--border-light)'}}>
            <h3 style={{marginTop: 0, marginBottom: '8px', color: 'var(--text-main)'}}>Settings</h3>
            <p style={{marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)'}}>
              Enter your own Gemini API Key to bypass the free daily limit (4 messages/day).
            </p>
            <input 
              type="text" 
              value={tempApiKey} 
              onChange={e => setTempApiKey(e.target.value)} 
              placeholder="AIzaSy..." 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="action-btn-v2" onClick={() => setShowSettingsModal(false)}>Cancel</button>
              <button className="generate-btn" onClick={() => {
                localStorage.setItem('gemini_api_key', tempApiKey);
                setShowSettingsModal(false);
              }} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                <span className="send-text">Save Key</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Installation Banner & Update Toast */}
      <PWAInstallPrompt />
      <PWAUpdateToast />
    </div>
  );
}

export default App;