import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Sparkles, Loader2, Copy, Check, Download, Play, User, MoreVertical, Plus, Trash2, Code2, Sun, Moon, Code, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import GettingStarted from './GettingStarted';
import Login from './components/Login';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'login', 'dashboard'
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [chats, setChats] = useState([]); // List of chat sessions from backend
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]); // Messages for the active chat
  
  const [input, setInput] = useState('');
  const [promptType, setPromptType] = useState('code');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [programmingLanguage, setProgrammingLanguage] = useState('Python');

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
      const res = await fetch(`${API_BASE_URL}/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setChats([]);
    setMessages([]);
    setCurrentChatId(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setView('landing');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      role: 'user', 
      content: input.trim(), 
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
      const response = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: currentChatId,
          content: input.trim(),
          type: currentType,
          lang: programmingLanguage,
        }),
      });

      if (!response.ok) {
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
      setInput('');
      
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

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInput('');
  };

  const getDisplayContent = () =>{ 
    if (isLoading && streamingMessage) return streamingMessage;
    // Show the last assistant message by default if not loading
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage) {
      return lastAssistantMessage.content;
    }
    return null;
  };

  const getExplanationOnly = (content) => {
    if (!content) return "";
    return content.replace(/```(\w+)?\s?\n?([\s\S]*?)```/g, "").trim();
  };

  const displayContent = getDisplayContent();
  const codeBlocks = displayContent ? getCodeBlocks(displayContent) : [];
  const hasCode = codeBlocks.length > 0;

  if (view === 'landing') {
    return <GettingStarted onGetStarted={() => {
      if (token) setView('dashboard');
      else setView('login');
    }} />;
  }

  if (view === 'login') {
    return <Login 
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
        <div className="logo-section" style={{ cursor: 'pointer' }} onClick={() => setView('landing')}>
          <div className="logo-square">
            <Code size={20} />
          </div>
          <h1 className="logo-text">AI CodeGen</h1>
        </div>
        
        <div className="top-right-actions">
          <button className="theme-toggle-v2" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="user-profile" title={user?.email}>
            <div className="user-avatar-placeholder" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '8px' }}>
              <User size={20} />
              <span style={{ fontSize: '12px' }}>{user?.display_name || 'User'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="icon-btn" title="Logout" style={{ marginLeft: '8px' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <aside className="panel-left">
          <div className="ui-card">
            <label className="card-label">Describe your function</label>
            <div className="prompt-input-container">
              <textarea
                className="prompt-textarea-v2"
                placeholder="Describe the function you want to create..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="controls-row">
                <select 
                  className="lang-select-v2"
                  value={programmingLanguage}
                  onChange={(e) => setProgrammingLanguage(e.target.value)}
                >
                  <option>Python</option>
                  <option>JavaScript</option>
                  <option>HTML/CSS</option>
                  <option>Modern Game</option>
                </select>
                <button 
                  className="generate-btn" 
                  onClick={handleSubmit}
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? <Loader2 size={18} className="spin-slow" /> : <Sparkles size={18} />}
                  <span>Generate Code</span>
                </button>
              </div>
            </div>
          </div>

          <div className="ui-card history-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label className="card-label" style={{ marginBottom: 0 }}>Your Chat History</label>
              <button onClick={startNewChat} className="icon-btn" title="New Chat">
                <Plus size={16} />
              </button>
            </div>
            <div className="history-list">
              {chats.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No chats yet. Try generating some code!
                </div>
              ) : (
                chats.map((chat) => (
                  <div 
                    key={chat.id} 
                    className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
                    onClick={() => loadChat(chat.id)}
                  >
                    <span className="history-text">{chat.title || 'New Chat'}</span>
                    <MoreVertical size={14} style={{ opacity: 0.5 }} />
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="panel-right">
          {!displayContent && !isLoading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', gap: '16px' }}>
              <Code2 size={64} strokeWidth={1} style={{ opacity: 0.2 }} />
              <div>
                <h2 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Ready to Code</h2>
                <p>Describe your needs on the left and I'll generate the solution here.</p>
              </div>
            </div>
          )}

          {(displayContent || isLoading) && (
            <>
              <div className="ui-card">
                <div className="output-header">
                  <h2 className="output-title">Generated Code</h2>
                </div>
                
                <div className="code-result-v2">
                  <div className="code-header-v2">
                    <span className="code-lang">{hasCode ? codeBlocks[0].lang : programmingLanguage}</span>
                    <div className="code-actions-top">
                      <button 
                        className="action-btn-v2" 
                        onClick={() => hasCode && handleCopy(codeBlocks[0].code, 'main-copy')}
                      >
                        {copiedId === 'main-copy' ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedId === 'main-copy' ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button 
                        className="action-btn-v2"
                        onClick={() => hasCode && handleDownload(codeBlocks[0].code, codeBlocks[0].lang)}
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </button>
                      <button 
                        className="action-btn-v2 primary"
                        onClick={() => hasCode && handleRun(codeBlocks[0].code, codeBlocks[0].lang)}
                      >
                        <Play size={14} fill="currentColor" />
                        <span>Run Code</span>
                      </button>
                    </div>
                  </div>
                  <div className="code-body-v3">
                    {isLoading && !streamingMessage ? (
                      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="shimmer-line" style={{ width: '80%' }} />
                        <div className="shimmer-line" style={{ width: '60%' }} />
                        <div className="shimmer-line" style={{ width: '70%' }} />
                      </div>
                    ) : (
                      <SyntaxHighlighter
                        language={hasCode ? codeBlocks[0].lang : 'javascript'}
                        style={vscDarkPlus}
                        showLineNumbers={true}
                        customStyle={{ margin: 0, padding: '20px', fontSize: '14px', background: 'transparent' }}
                      >
                        {hasCode ? codeBlocks[0].code : (streamingMessage || "Generating...")}
                      </SyntaxHighlighter>
                    )}
                  </div>
                </div>
              </div>

              <div className="ui-card explanation-card">
                <label className="card-label">Code Explanation</label>
                <div className="markdown-content-v2">
                   {isLoading && !streamingMessage ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       <div className="shimmer-line" style={{ width: '100%' }} />
                       <div className="shimmer-line" style={{ width: '90%' }} />
                       <div className="shimmer-line" style={{ width: '95%' }} />
                     </div>
                   ) : (
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {getExplanationOnly(displayContent)}
                      </ReactMarkdown>
                   )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="dashboard-footer" style={{ position: 'fixed', bottom: 0, width: '100%', padding: '12px 32px', display: 'flex', gap: '24px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--panel-bg)', zIndex: 90 }}>
        <span>Documentation</span>
        <span>Pricing</span>
        <span>Support</span>
      </footer>
    </div>
  );
}

export default App;