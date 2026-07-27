import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { 
  Code, 
  Copy, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  Search,
  Loader2,
  Terminal,
  X,
  Sparkles
} from 'lucide-react';
import './Snippets.css';

const Snippets = ({ user, onBack }) => {
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/snippets');
      if (!res.ok) throw new Error('Failed to load snippets');
      const data = await res.json();
      setSnippets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (code, lang, title) => {
    const ext = lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang === 'html' ? 'html' : lang === 'css' ? 'css' : 'txt';
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startEdit = (snippet) => {
    setEditingId(snippet.id);
    setEditTitle(snippet.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetchApi(`/snippets/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle.trim() })
      });
      if (res.ok) {
        setSnippets(snippets.map(s => s.id === id ? { ...s, title: editTitle.trim() } : s));
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      const res = await fetchApi(`/snippets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSnippets(snippets.filter(s => s.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="snippets-container">
      <div className="snippets-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onBack && (
            <button onClick={onBack} className="icon-btn" title="Back to Chat">
              <Terminal size={20} />
            </button>
          )}
          <div>
            <h2>My Snippets</h2>
            <p>Your personal code library</p>
          </div>
        </div>
        
        <div className="snippets-search">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search snippets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="snippets-loading">
          <Loader2 size={32} className="spin" />
          <p>Loading your library...</p>
        </div>
      ) : error ? (
        <div className="snippets-error">
          <p>{error}</p>
          <button onClick={fetchSnippets} className="btn-secondary">Try Again</button>
        </div>
      ) : snippets.length === 0 ? (
        <div className="snippets-empty">
          <Code size={48} className="empty-icon" />
          <h3>No Snippets Yet</h3>
          <p>When the AI generates code you love, click the "Save Snippet" button to store it here.</p>
          {onBack && (
            <button onClick={onBack} className="generate-btn" style={{ marginTop: '24px', padding: '12px 24px', fontSize: '16px' }}>
              <Sparkles size={18} />
              Start Coding
            </button>
          )}
        </div>
      ) : (
        <div className="snippets-grid">
          {filteredSnippets.length === 0 ? (
            <div className="snippets-empty-search">
              <p>No snippets match your search.</p>
            </div>
          ) : (
            filteredSnippets.map(snippet => (
              <div key={snippet.id} className="snippet-card">
                <div className="snippet-header">
                  <div className="snippet-title-row">
                    {editingId === snippet.id ? (
                      <div className="snippet-edit-wrapper">
                        <input 
                          type="text" 
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(snippet.id)}
                          autoFocus
                        />
                        <button onClick={() => saveEdit(snippet.id)} className="icon-btn success"><Check size={14} /></button>
                        <button onClick={cancelEdit} className="icon-btn danger"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <h3 className="snippet-title" title={snippet.title}>{snippet.title}</h3>
                        <button onClick={() => startEdit(snippet)} className="icon-btn-small hover-only">
                          <Edit3 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                  <span className="snippet-lang">{snippet.language}</span>
                </div>
                
                <div className="snippet-code-preview">
                  <pre><code>{snippet.code_content}</code></pre>
                </div>
                
                <div className="snippet-footer">
                  <span className="snippet-date">
                    {new Date(snippet.createdAt).toLocaleDateString()}
                  </span>
                  <div className="snippet-actions">
                    <button 
                      className="snippet-action-btn"
                      onClick={() => handleCopy(snippet.code_content, snippet.id)}
                      title="Copy code"
                    >
                      {copiedId === snippet.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                    <button 
                      className="snippet-action-btn"
                      onClick={() => handleDownload(snippet.code_content, snippet.language, snippet.title)}
                      title="Download file"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      className="snippet-action-btn danger-hover"
                      onClick={() => setDeleteConfirmId(snippet.id)}
                      title="Delete snippet"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="snippets-modal-overlay">
          <div className="snippets-modal">
            <h3>Delete Snippet</h3>
            <p>Are you sure you want to delete this snippet? This action cannot be undone.</p>
            <div className="snippets-modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary danger" 
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={16} className="spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Snippets;
