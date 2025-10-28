// src/pages/Login.tsx
import React, { useState } from "react";
import "./Login.css";

interface LoginFormData {
  username: string;
  password: string;
}

export default function Login({ onEnter }: { onEnter: () => void }) {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Temporary login handler until backend is implemented
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug log to see what's being submitted
    console.log('Login attempt with:', formData);
    
    // Temporary login logic (remove this when backend is ready)
    if (formData.username === 'admin' && formData.password === 'admin123') {
      console.log('Admin login successful');
      localStorage.setItem('role', 'admin');
      localStorage.setItem('username', formData.username);
      onEnter();
    } else if (formData.username === 'user' && formData.password === 'user123') {
      console.log('User login successful');
      localStorage.setItem('role', 'user');
      localStorage.setItem('username', formData.username);
      onEnter();
    } else {
      console.log('Login failed - Invalid credentials');
      setError('Invalid username or password');
    }
    
    // Comment out the actual API call for now
    /* 
    try {
      // This will be uncommented when backend is ready
      const response = await axios.post<LoginResponse>('http://localhost:3001/api/login', formData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('username', response.data.username);
        onEnter();
        // When backend is wired, App's view will change via onEnter; avoid full-page redirects here
      }
    } catch (err) {
      setError('Invalid username or password');
      console.error('Login error:', err);
    }
    */
  };

  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="welcome-head">
          <div className="logo-tag">TITLEHERO</div>
          <div className="ctas">
            <button className="btn" onClick={() => void 0}>Docs</button>
          </div>
        </div>

        <h1 style={{ margin: 0 }}>Welcome, USER</h1>

        <form onSubmit={handleSubmit} className="welcome-form">
          <div className="field">
            <label htmlFor="org">Title Hero, enter cool slogan here.</label>
          </div>
        
        {/* login information will be here! Does not do anything right now */}

          {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

          <div className="row-2">
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                className="input"
                placeholder="<your username>"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                placeholder="<your password>"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="cta-row">
            <button className="btn" onClick={() => void 0}>
              Help
            </button>
            <button type="submit" className="btn btn-primary">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
