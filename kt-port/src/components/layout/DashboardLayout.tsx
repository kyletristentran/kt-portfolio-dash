'use client';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentUser: { name?: string } | null;
  onLogout: () => void;
}

export default function DashboardLayout({ children, currentUser, onLogout }: DashboardLayoutProps) {

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        {/* Main Header */}
        <div className="main-header">
          <div className="header-container">
            <div className="main-header-content">
              <div className="logo-section">
                <div className="logo">KYLE TRAN</div>
                <div className="logo-subtitle">Real Estate Investment Analytics</div>
              </div>
              <div className="user-info">
                <div className="user-email">{currentUser?.name || 'kylettra@usc.edu'}</div>
                <button className="logout-btn" onClick={onLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 Kyle Tran. Built with modern web technologies | Powered by innovation in PropTech</p>
      </footer>
    </>
  );
}