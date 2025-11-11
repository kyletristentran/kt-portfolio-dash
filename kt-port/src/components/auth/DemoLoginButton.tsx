'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DemoLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function DemoLoginButton({ onSuccess, onError }: DemoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Sign in with demo credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@kyletran.dev',
        password: 'demo123',
      });

      if (error) {
        console.error('Demo login error:', error);
        onError?.(error.message || 'Failed to login with demo account');
        return;
      }

      if (data.user) {
        console.log('Demo login successful:', data.user.email);
        onSuccess?.();
      }
    } catch (err) {
      console.error('Demo login exception:', err);
      onError?.('An unexpected error occurred during demo login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDemoLogin}
      disabled={isLoading}
      className="btn-demo-login"
    >
      {isLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Logging in as Demo...
        </>
      ) : (
        <>
          <i className="fas fa-eye"></i> Login as Demo
        </>
      )}

      <style jsx>{`
        .btn-demo-login {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, var(--accent-gold) 0%, #b8955a 100%);
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 6px rgba(201, 169, 97, 0.3);
        }

        .btn-demo-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(201, 169, 97, 0.4);
          background: linear-gradient(135deg, #d4b46f 0%, var(--accent-gold) 100%);
        }

        .btn-demo-login:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(201, 169, 97, 0.3);
        }

        .btn-demo-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner-border {
          width: 1rem;
          height: 1rem;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          display: inline-block;
          animation: spinner-border 0.75s linear infinite;
        }

        .spinner-border-sm {
          width: 0.875rem;
          height: 0.875rem;
          border-width: 2px;
        }

        @keyframes spinner-border {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
