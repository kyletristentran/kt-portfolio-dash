'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentUser: any;
  onLogout: () => void;
}

export default function DashboardLayout({ children, currentUser, onLogout }: DashboardLayoutProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('[data-toggle="sidebar"]');
      
      if (sidebarOpen && sidebar && !sidebar.contains(event.target as Node) && 
          toggleButton && !toggleButton.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sidebarOpen]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [router]);

  const refreshData = () => {
    // Trigger a refresh of dashboard data
    window.location.reload();
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/test-connection');
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Database connection successful! Found ${result.tableCount} tables.`);
      } else {
        alert(`❌ Database connection failed: ${result.message}`);
      }
    } catch (error) {
      alert('❌ Error testing connection');
    }
  };

  const exportData = () => {
    // TODO: Implement export functionality
    alert('Export functionality would download data as CSV/Excel');
  };

  const currentYears = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="dashboard-wrapper">
      {/* Top Navigation */}
      <nav className="main-navbar">
        <div className="container-fluid d-flex align-items-center justify-content-between px-4">
          <div className="d-flex align-items-center">
            <a className="navbar-brand text-white text-decoration-none fw-bold text-uppercase ls-2">
              KYLE'S REIT
            </a>
          </div>
          
          <button 
            className="btn text-white d-lg-none"
            onClick={toggleSidebar}
            type="button"
            data-toggle="sidebar"
            aria-label="Toggle navigation"
          >
            <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          <div className="d-flex align-items-center">
            <span className="text-white me-3">
              Welcome, {currentUser?.name || 'User'}
            </span>
            <button 
              className="btn btn-sm text-white"
              onClick={onLogout}
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Layout */}
      <div className="d-flex">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'show' : ''}`}>
          <div className="sidebar-section">
            <h6 className="sidebar-title">Dashboard Controls</h6>
            <div className="mb-3">
              <label className="form-label">Select Year</label>
              <select 
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {currentYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button 
              className="btn btn-trea w-100"
              onClick={refreshData}
            >
              <i className="fas fa-sync"></i> Refresh Data
            </button>
          </div>

          <div className="sidebar-section">
            <h6 className="sidebar-title">Quick Actions</h6>
            <button 
              className="btn btn-trea-outline btn-sm w-100 mb-2"
              onClick={exportData}
            >
              <i className="fas fa-download"></i> Export Data
            </button>
            <button 
              className="btn btn-trea-outline btn-sm w-100 mb-2"
              onClick={() => alert('Import modal would open for file upload')}
            >
              <i className="fas fa-upload"></i> Import Financials
            </button>
            <button 
              className="btn btn-trea-outline btn-sm w-100"
              onClick={testConnection}
            >
              <i className="fas fa-database"></i> Test DB Connection
            </button>
          </div>

          <div className="sidebar-section">
            <h6 className="sidebar-title">System Status</h6>
            <div className="text-muted">
              <small>
                <i className="fas fa-circle text-success"></i> Database: Connected<br/>
                <i className="fas fa-circle text-success"></i> Last Update: Just now
              </small>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}