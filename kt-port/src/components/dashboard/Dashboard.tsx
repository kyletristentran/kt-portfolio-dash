'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceOverview from './PerformanceOverview';
import PortfolioAnalysis from './PortfolioAnalysis';
import FinancialTrends from './FinancialTrends';
import PropertyDetails from './PropertyDetails';
import DataManagement from './DataManagement';
import MonthlyFinancials from './MonthlyFinancials';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('ytd');
  const [selectedComparison, setSelectedComparison] = useState('mom');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', component: PerformanceOverview },
    { id: 'properties', label: 'Properties', component: PropertyDetails },
    { id: 'financials', label: 'Monthly Financials', component: MonthlyFinancials },
    { id: 'performance', label: 'Performance', component: PortfolioAnalysis },
    { id: 'reports', label: 'Reports', component: FinancialTrends },
  ];

  const activeTabComponent = tabs.find(tab => tab.id === activeTab)?.component;
  const ActiveComponent = activeTabComponent || PerformanceOverview;

  const formattedUser = user ? { name: user.email || user.user_metadata?.full_name || 'User' } : null;

  const refreshData = () => {
    window.location.reload();
  };

  const exportData = () => {
    alert('Export functionality would generate CSV/Excel reports with all financial data for the selected filters.');
  };

  return (
    <DashboardLayout currentUser={formattedUser} onLogout={signOut}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Investment Portfolio Dashboard</h1>
        <p className="page-subtitle">
          Real-time performance metrics and comprehensive portfolio analysis
        </p>
      </div>

      {/* Tab Navigation */}
      <nav className="tab-navigation">
        <div className="nav-container">
          <ul className="nav-menu">
            {tabs.map((tab) => (
              <li
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              >
                <a
                  href="#"
                  className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(tab.id);
                  }}
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filters-inline">
          <div className="filter-item">
            <i className="fas fa-building filter-icon"></i>
            <select
              id="propertyFilter"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Properties</option>
            </select>
          </div>
          <div className="filter-item">
            <i className="fas fa-calendar filter-icon"></i>
            <select
              id="monthFilter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Months</option>
              <option value="2025-10">October 2025</option>
              <option value="2025-09">September 2025</option>
              <option value="2025-08">August 2025</option>
            </select>
          </div>
          <div className="filter-item">
            <i className="fas fa-calendar-alt filter-icon"></i>
            <select
              id="periodFilter"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="filter-select"
            >
              <option value="ytd">Year to Date</option>
              <option value="last-12">Last 12 Months</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div className="filter-item">
            <i className="fas fa-chart-line filter-icon"></i>
            <select
              id="comparisonFilter"
              value={selectedComparison}
              onChange={(e) => setSelectedComparison(e.target.value)}
              className="filter-select"
            >
              <option value="mom">Month over Month</option>
              <option value="yoy">Year over Year</option>
            </select>
          </div>
        </div>
        <div className="filters-actions">
          <button className="btn-filter" onClick={exportData} title="Export Data">
            <i className="fas fa-download"></i>
          </button>
          <button className="btn-filter" onClick={refreshData} title="Refresh">
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Alert Section */}
      <div id="alertSection"></div>

      {/* Tab Content */}
      <div className="tab-content">
        <ActiveComponent />
      </div>
    </DashboardLayout>
  );
}