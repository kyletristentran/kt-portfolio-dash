'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError('Invalid credentials. Please try again.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const showDemoAccount = () => {
    setShowDemo(!showDemo);
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
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
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

          <button
            type="button"
            className="btn btn-trea-outline w-100"
            onClick={showDemoAccount}
          >
            Demo Access
          </button>
        </form>

        {showDemo && (
          <div className="alert alert-info mt-3">
            <h6 className="alert-heading">🎯 For Recruiters & Demo Access:</h6>
            <div className="mb-2">
              <strong>Email:</strong> kylettra@usc.edu<br/>
              <strong>Password:</strong> usc1234
            </div>
            <small className="text-muted">
              💡 <em>Click Login to access the dashboard</em>
            </small>
          </div>
        )}
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
      `}</style>
    </div>
  );
}
