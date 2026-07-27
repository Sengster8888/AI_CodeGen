import React, { useState, useRef } from 'react';
import { Loader2, Mail, KeyRound, ArrowRight, ArrowLeft, Code, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import logoImage from '../assets/logo.png';
import googleIcon from '../assets/google-60.png';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const Login = ({ initialMode = 'login', onLoginSuccess, onBack }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthSuccess = (data) => {
    // Both login and verify return { user, accessToken } (cookies handle the rest)
    onLoginSuccess(data.accessToken, data.user);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please enter email and password');
    
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !displayName) return setError('All fields are required');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (!policiesAccepted) return setError('You must accept the Terms of Service and Privacy Policy to register.');
    
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setMode('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) return setError('Please enter the 6-digit code');

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/verify-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email');
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code');
      setMode('reset-password');
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) return setError('Please enter the 6-digit code');
    
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid or expired code');
      setMode('set-new-password');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (!password || !confirmPassword) return setError('Please enter your new password');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    // Take only the last character if they pasted multiple or typed fast
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.access_token })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Google Login failed');
        handleAuthSuccess(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google Login Failed')
  });

  return (
    <div className="login-container">
      <button 
        className="back-btn-floating"
        onClick={onBack} 
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
              <img src={logoImage} alt="AI CodeGen" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', margin: 0 }}>AI CodeGen</h1>
            </div>
            <h2>
              {mode === 'login' ? 'Welcome Back' : 
               mode === 'register' ? 'Create an Account' : 
               mode === 'verify' ? 'Verify Email' :
               mode === 'forgot-password' ? 'Reset Password' :
               mode === 'reset-password' ? 'Verify Code' :
               'Set New Password'}
            </h2>
            <p>
              {mode === 'login' ? 'Sign in to your account' : 
               mode === 'register' ? 'Sign up to start coding' : 
               mode === 'verify' ? 'Enter the 6-digit code sent to your email' :
               mode === 'forgot-password' ? 'Enter your email to receive a reset code' :
               mode === 'reset-password' ? 'Enter the 6-digit reset code sent to your email' :
               'Enter your new password below'}
            </p>
          </div>

          {error && <div className="login-error">{error}</div>}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus disabled={isLoading} />
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-12px' }}>
                <button type="button" onClick={() => { setMode('forgot-password'); setError(''); }} className="forgot-password-link">Forgot Password?</button>
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="spin-slow" size={18} /> : 'Login'}
              </button>
              
              <div style={{ textAlign: 'center', margin: '15px 0', color: 'var(--text-muted)' }}>OR</div>
              
              <button 
                type="button" 
                className="google-custom-btn" 
                onClick={() => loginWithGoogle()}
                disabled={isLoading}
              >
                <img src={googleIcon} alt="Google" className="google-icon" />
                Continue with Google
              </button>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px', lineHeight: '1.4' }}>
                By continuing with Google, you agree to our <a href="#" onClick={(e) => { e.preventDefault(); setShowPolicyModal('tos'); }}>Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); setShowPolicyModal('privacy'); }}>Privacy Policy</a>.
              </div>
              
              <button type="button" className="back-button" onClick={() => setMode('register')} disabled={isLoading}>
                Don't have an account? Sign up
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="login-form">
              <div className="input-group">
                <User className="input-icon" size={18} />
                <input type="text" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoFocus disabled={isLoading} />
              </div>
              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
                <button type="button" className="toggle-password-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? "Hide password" : "Show password"}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '8px 0 16px 0' }}>
                <input 
                  type="checkbox" 
                  id="policy-checkbox" 
                  checked={policiesAccepted} 
                  onChange={(e) => setPoliciesAccepted(e.target.checked)} 
                  disabled={isLoading}
                  style={{ marginTop: '4px' }}
                />
                <label htmlFor="policy-checkbox" style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  I agree to the <a href="#" onClick={(e) => { e.preventDefault(); setShowPolicyModal('tos'); }}>Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); setShowPolicyModal('privacy'); }}>Privacy Policy</a>
                </label>
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="spin-slow" size={18} /> : 'Create Account'}
              </button>
              <button type="button" className="back-button" onClick={() => setMode('login')} disabled={isLoading}>
                Already have an account? Login
              </button>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerifyOTP} className="login-form">
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-input"
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="spin-slow" size={18} /> : 'Verify & Login'}
              </button>
              <button type="button" className="back-button" onClick={() => setMode('register')} disabled={isLoading}>
                Use a different email
              </button>
            </form>
          )}

          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="login-form">
              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus disabled={isLoading} />
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="spin-slow" size={18} /> : 'Send Reset Code'}
              </button>
              <button type="button" className="back-button" onClick={() => setMode('login')} disabled={isLoading}>
                Back to Login
              </button>
            </form>
          )}

          {mode === 'reset-password' && (
            <form onSubmit={handleVerifyResetOtp} className="login-form">
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-input"
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="spin-slow" size={18} /> : 'Verify Code'}
              </button>
              <button type="button" className="back-button" onClick={() => setMode('login')} disabled={isLoading}>
                Back to Login
              </button>
            </form>
          )}

          {mode === 'set-new-password' && (
            <form onSubmit={handleResetPassword} className="login-form">
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input type={showPassword ? "text" : "password"} placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus disabled={isLoading} />
                <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
                <button type="button" className="toggle-password-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? "Hide password" : "Show password"}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="spin-slow" size={18} /> : 'Reset Password'}
              </button>
              <button type="button" className="back-button" onClick={() => setMode('login')} disabled={isLoading}>
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>

      {showPolicyModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{backgroundColor: 'var(--panel-bg)', padding: '32px', borderRadius: '16px', width: '600px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-light)'}}>
            <h2 style={{marginTop: 0, marginBottom: '16px', color: 'var(--text-main)', fontSize: '24px'}}>
              {showPolicyModal === 'tos' ? 'Terms of Service' : 'Privacy Policy'}
            </h2>
            <div style={{flex: 1, overflowY: 'auto', paddingRight: '12px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6'}}>
              {showPolicyModal === 'tos' ? (
                <>
                  <h3 style={{color: 'var(--text-main)', marginBottom: '8px'}}>1. Acceptance of Terms</h3>
                  <p style={{marginBottom: '16px'}}>By registering for and using AI CodeGen, you accept and agree to be bound by the terms and provision of this agreement.</p>
                  <h3 style={{color: 'var(--text-main)', marginBottom: '8px'}}>2. Description of Service</h3>
                  <p style={{marginBottom: '16px'}}>AI CodeGen provides users with access to a rich collection of resources, including various artificial intelligence tools to assist in software development.</p>
                  <h3 style={{color: 'var(--text-main)', marginBottom: '8px'}}>3. User Conduct</h3>
                  <p style={{marginBottom: '16px'}}>You agree to use the service only for lawful purposes. You are prohibited from violating or attempting to violate the security of the service.</p>
                </>
              ) : (
                <>
                  <h3 style={{color: 'var(--text-main)', marginBottom: '8px'}}>1. Information Collection</h3>
                  <p style={{marginBottom: '16px'}}>We collect information you provide directly to us, such as when you create or modify your account, or contact customer support.</p>
                  <h3 style={{color: 'var(--text-main)', marginBottom: '8px'}}>2. Use of Information</h3>
                  <p style={{marginBottom: '16px'}}>We use the information we collect to provide, maintain, and improve our services, as well as to develop new ones.</p>
                  <h3 style={{color: 'var(--text-main)', marginBottom: '8px'}}>3. Sharing of Information</h3>
                  <p style={{marginBottom: '16px'}}>We may share your information as described in this policy, such as with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
                </>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <button 
                onClick={() => setShowPolicyModal(null)} 
                style={{ padding: '10px 24px', backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
