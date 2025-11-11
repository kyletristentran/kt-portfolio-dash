'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import InactivityWarning from './InactivityWarning';

interface User {
  username: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds
const WARNING_TIME = 30 * 1000; // Show warning 30 seconds before logout

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    setShowWarning(false);
    sessionStorage.removeItem('dashboard_user');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Hide warning if it's showing
    setShowWarning(false);

    // Only set timer if user is logged in
    if (user) {
      // Set warning timer (30 seconds before logout)
      warningTimerRef.current = setTimeout(() => {
        console.log('⚠️ Showing inactivity warning');
        setShowWarning(true);
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      // Set logout timer (full timeout)
      inactivityTimerRef.current = setTimeout(() => {
        console.log('🔒 Auto logout due to inactivity');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, logout]);

  const handleStayLoggedIn = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    // Check if user is already logged in (from sessionStorage - clears on browser close)
    const savedUser = sessionStorage.getItem('dashboard_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Set up inactivity tracking
  useEffect(() => {
    if (!user) return;

    // Events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Start the initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simple authentication - recruiter-friendly credentials
    if (username === 'kyle' && password === 'tran') {
      const userData = { username: 'kyle', name: 'Kyle Tran' };
      setUser(userData);
      sessionStorage.setItem('dashboard_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
      {showWarning && (
        <InactivityWarning
          timeRemaining={WARNING_TIME}
          onStayLoggedIn={handleStayLoggedIn}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
