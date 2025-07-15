'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceOverview from './PerformanceOverview';
import PortfolioAnalysis from './PortfolioAnalysis';
import FinancialTrends from './FinancialTrends';
import PropertyDetails from './PropertyDetails';
import DataManagement from './DataManagement';
import MonthlyFinancials from './MonthlyFinancials';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Performance Overview', component: PerformanceOverview },
    { id: 'portfolio', label: 'Portfolio Analysis', component: PortfolioAnalysis },
    { id: 'trends', label: 'Financial Trends', component: FinancialTrends },
    { id: 'properties', label: 'Property Details', component: PropertyDetails },
    { id: 'dataManagement', label: 'Data Management', component: DataManagement },
    { id: 'monthlyFinancials', label: 'Monthly Financials', component: MonthlyFinancials },
  ];

  const activeTabComponent = tabs.find(tab => tab.id === activeTab)?.component;
  const ActiveComponent = activeTabComponent || PerformanceOverview;

  return (
    <DashboardLayout currentUser={user} onLogout={logout}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Real Estate Investment Dashboard</h1>
        <p className="page-subtitle">
          Portfolio Performance Analysis - <span>{new Date().getFullYear()}</span>
        </p>
      </div>

      {/* Alert Section */}
      <div id="alertSection"></div>

      {/* Tabs Navigation */}
      <ul className="nav nav-tabs" role="tablist">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        <div className="tab-pane fade show active">
          <ActiveComponent />
        </div>
      </div>
    </DashboardLayout>
  );
}