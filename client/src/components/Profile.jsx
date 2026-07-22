import React, { useState } from 'react';
import { User, Lock, Trash2, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { fetchApi } from '../utils/api';
import './Profile.css';

const Profile = ({ user, setUser, onLogout, onBack }) => {
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpConfirm, setShowOtpConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [nameMessage, setNameMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  
  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    setIsUpdatingName(true);
    setNameMessage(null);
    try {
      const res = await fetchApi('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ displayName: displayName.trim() })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      
      setUser(data.user);
      setNameMessage({ type: 'success', text: 'Display name updated successfully!' });
      setTimeout(() => setNameMessage(null), 3000);
    } catch (err) {
      setNameMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleRequestOtp = async () => {
    setShowOtpConfirm(false);
    setIsSendingOtp(true);
    setPasswordMessage(null);
    try {
      const res = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: user?.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setOtpSent(true);
      setPasswordMessage({ type: 'success', text: 'Verification code sent to your email.' });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setPasswordMessage({ type: 'error', text: 'Please enter the 6-digit code' });
      return;
    }
    if (!password || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in both password fields' });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    setIsUpdatingPassword(true);
    setPasswordMessage(null);
    try {
      const res = await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: user?.email, otp, newPassword: password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setOtpSent(false);
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      const res = await fetchApi('/auth/me', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete account');
      onLogout();
    } catch (err) {
      alert(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="profile-container">
      <button 
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', 
          background: 'none', border: 'none', color: 'var(--text-muted)', 
          cursor: 'pointer', marginBottom: '24px', fontSize: '14px',
          padding: 0
        }}
        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={16} /> Back to Chat
      </button>
      
      <div className="profile-header">
        <h2>Account Settings</h2>
        <p>Manage your profile and account preferences</p>
      </div>

      <div className="profile-section">
        <h3><User size={20} /> Personal Information</h3>
        <form onSubmit={handleUpdateName}>
          <div className="profile-form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="profile-input" 
              value={user?.email || ''} 
              disabled 
            />
          </div>
          <div className="profile-form-group">
            <label>Display Name</label>
            <input 
              type="text" 
              className="profile-input" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={isUpdatingName}
            />
          </div>
          <button type="submit" className="profile-btn" disabled={isUpdatingName || !displayName.trim() || displayName === user?.display_name}>
            {isUpdatingName ? <Loader2 className="spin-slow" size={16} /> : 'Save Changes'}
          </button>
          {nameMessage && (
            <div className={`profile-message ${nameMessage.type}`}>
              {nameMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {nameMessage.text}
            </div>
          )}
        </form>
      </div>

      <div className="profile-section">
        <h3><Lock size={20} /> Change Password</h3>
        
        {!otpSent ? (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              To change your password, we need to verify your identity. We'll send a 6-digit code to <strong>{user?.email}</strong>.
            </p>
            <button 
              type="button" 
              className="profile-btn" 
              onClick={() => setShowOtpConfirm(true)} 
              disabled={isSendingOtp || !user?.email}
            >
              {isSendingOtp ? <Loader2 className="spin-slow" size={16} /> : 'Request Reset Code'}
            </button>
            {passwordMessage && (
              <div className={`profile-message ${passwordMessage.type}`}>
                {passwordMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {passwordMessage.text}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <div className="profile-form-group">
              <label>Verification Code</label>
              <input 
                type="text" 
                className="profile-input" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code from email"
                disabled={isUpdatingPassword}
              />
            </div>
            <div className="profile-form-group">
              <label>New Password</label>
              <input 
                type="password" 
                className="profile-input" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                disabled={isUpdatingPassword}
              />
            </div>
            <div className="profile-form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                className="profile-input" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isUpdatingPassword}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="profile-btn" disabled={isUpdatingPassword || !password || !confirmPassword || otp.length !== 6}>
                {isUpdatingPassword ? <Loader2 className="spin-slow" size={16} /> : 'Update Password'}
              </button>
              <button type="button" className="profile-btn" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-light)' }} onClick={() => { setOtpSent(false); setPasswordMessage(null); }} disabled={isUpdatingPassword}>
                Cancel
              </button>
            </div>
            {passwordMessage && (
              <div className={`profile-message ${passwordMessage.type}`}>
                {passwordMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {passwordMessage.text}
              </div>
            )}
          </form>
        )}
      </div>

      <div className="profile-section" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <h3 style={{ color: '#ef4444' }}><Trash2 size={20} /> Danger Zone</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button 
          className="profile-btn danger" 
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="spin-slow" size={16} /> : 'Delete Account'}
        </button>
      </div>

      {/* Custom Confirmation Modal */}
      {showOtpConfirm && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <h3>Confirm Request</h3>
            <p>Are you sure you want to send a password reset code to <strong>{user?.email}</strong>?</p>
            <div className="profile-modal-actions">
              <button 
                type="button" 
                className="profile-btn-secondary" 
                onClick={() => setShowOtpConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="profile-btn" 
                onClick={handleRequestOtp}
              >
                Send Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Delete Account */}
      {showDeleteConfirm && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <h3>Delete Account</h3>
            <p>Are you absolutely sure you want to delete your account? This action cannot be undone.</p>
            <div className="profile-modal-actions">
              <button 
                type="button" 
                className="profile-btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="profile-btn danger" 
                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
