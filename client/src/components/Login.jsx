import React, { useState } from 'react';
import { Loader2, Mail, KeyRound, ArrowRight, Code } from 'lucide-react';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const Login = ({ onLoginSuccess, onBack }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <nav className="nav-simple">
        <div className="logo-section" style={{ cursor: 'pointer' }} onClick={onBack}>
          <div className="logo-square">
            <Code size={20} />
          </div>
          <span className="logo-text">AI CodeGen</span>
        </div>
        <div className="nav-links">
          <span>Docs</span>
          <span>Community</span>
        </div>
      </nav>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>{step === 1 ? 'Sign in with your email to continue' : 'Enter the 6-digit code sent to your email'}</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleRequestOTP} className="login-form">
              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="spin-slow" size={18} /> : 'Send Login Code'}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="login-form">
              <div className="input-group">
                <KeyRound className="input-icon" size={18} />
                <input 
                  type="text" 
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="spin-slow" size={18} /> : 'Verify & Login'}
              </button>
              <button 
                type="button" 
                className="back-button" 
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
