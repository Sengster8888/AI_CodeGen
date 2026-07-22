const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include' // crucial for cookies
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle auto-refresh if token expired
  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('auth_token', data.accessToken);
        
        // Retry original request with new token
        config.headers['Authorization'] = `Bearer ${data.accessToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      } else {
        // Refresh failed (refresh token expired/missing) -> force logout
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.reload();
      }
    } catch (e) {
      console.error('Refresh error', e);
    }
  }

  return response;
};
