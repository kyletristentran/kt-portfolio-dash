'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import DemoLoginButton from './DemoLoginButton';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch {
      setError('An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  const handleDemoSuccess = () => {
    // Redirect to dashboard after successful demo login
    router.push('/');
  };

  const handleDemoError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="login-background">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">KYLE&apos;S REIT</div>
          <h2 className="h4 text-uppercase mb-2">Investment Dashboard</h2>
          <p className="text-muted">Access your real estate portfolio analytics</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username" 
              required 
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn btn-trea w-100 mb-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
          
          <div className="divider-container">
            <div className="divider-line"></div>
            <span className="divider-text">OR</span>
            <div className="divider-line"></div>
          </div>

          <DemoLoginButton
            onSuccess={handleDemoSuccess}
            onError={handleDemoError}
          />
        </form>
      </div>

      <style jsx>{`
        .login-background {
          min-height: 100vh;
          background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), 
                      url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 0;
          box-shadow: 0 0 30px rgba(0,0,0,0.3);
          padding: 3rem;
          max-width: 450px;
          width: 100%;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-logo {
          background-color: var(--primary-navy);
          color: white;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          font-size: 2rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .divider-container {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background-color: #dee2e6;
        }

        .divider-text {
          padding: 0 1rem;
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .alert {
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid transparent;
        }

        .alert-info {
          background-color: #cfe2ff;
          border-color: #b6d4fe;
          color: #084298;
        }

        .alert-heading {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .alert strong {
          font-weight: 600;
        }

        .alert small {
          display: block;
          margin-top: 0.5rem;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input-wrapper .form-control {
          padding-right: 45px;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .password-toggle-btn:hover {
          color: var(--primary-navy);
        }

        .password-toggle-btn:focus {
          outline: none;
        }

        .password-toggle-btn i {
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}