'use client';

import { useState, useEffect } from 'react';

interface InactivityWarningProps {
  timeRemaining: number; // in milliseconds
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export default function InactivityWarning({ timeRemaining, onStayLoggedIn, onLogout }: InactivityWarningProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(timeRemaining / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onLogout]);

  return (
    <div className="inactivity-overlay">
      <div className="inactivity-modal">
        <div className="warning-icon">
          <i className="fas fa-clock"></i>
        </div>
        <h3>Still there?</h3>
        <p>You will be logged out due to inactivity in:</p>
        <div className="countdown">
          <span className="countdown-number">{secondsLeft}</span>
          <span className="countdown-label">seconds</span>
        </div>
        <div className="button-group">
          <button className="btn-primary" onClick={onStayLoggedIn}>
            <i className="fas fa-check"></i> Stay Logged In
          </button>
          <button className="btn-secondary" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout Now
          </button>
        </div>
      </div>

      <style jsx>{`
        .inactivity-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .inactivity-modal {
          background: white;
          border-radius: 8px;
          padding: 40px;
          max-width: 450px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .warning-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .warning-icon i {
          font-size: 40px;
          color: white;
        }

        .inactivity-modal h3 {
          color: var(--primary-navy);
          font-size: 1.75rem;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .inactivity-modal p {
          color: #666;
          font-size: 1rem;
          margin-bottom: 20px;
        }

        .countdown {
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px solid #e9ecef;
        }

        .countdown-number {
          display: block;
          font-size: 3rem;
          font-weight: 700;
          color: var(--accent-gold);
          line-height: 1;
          margin-bottom: 10px;
        }

        .countdown-label {
          display: block;
          font-size: 0.875rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .button-group {
          display: flex;
          gap: 15px;
          margin-top: 30px;
        }

        .button-group button {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: var(--primary-navy);
          color: white;
        }

        .btn-primary:hover {
          background: #0f1820;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26, 35, 50, 0.3);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
        }

        @media (max-width: 500px) {
          .inactivity-modal {
            margin: 20px;
            padding: 30px 20px;
          }

          .button-group {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
