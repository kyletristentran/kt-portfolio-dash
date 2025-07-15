'use client';

import { useState, useEffect } from 'react';

interface Property {
  PropertyID: number;
  PropertyName: string;
}

interface MonthlyFinancialRecord {
  FinancialID: number;
  PropertyID: number;
  PropertyName: string;
  ReportingMonth: Date;
  GrossRent: number;
  Vacancy: number;
  OtherIncome: number;
  TotalIncome: number;
  RepairsMaintenance: number;
  Utilities: number;
  PropertyManagement: number;
  PropertyTaxes: number;
  Insurance: number;
  Marketing: number;
  Administrative: number;
  TotalExpenses: number;
  NOI: number;
  DebtService: number;
  CashFlow: number;
  Occupancy: number;
  FilePath: string;
}

export default function DataManagement() {
  const [records, setRecords] = useState<MonthlyFinancialRecord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProperty, setSelectedProperty] = useState<number | ''>('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchProperties();
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedYear, selectedProperty]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      if (selectedProperty) {
        params.append('propertyId', selectedProperty.toString());
      }

      const response = await fetch(`/api/financials/records?${params}`);
      if (!response.ok) throw new Error('Failed to fetch financial records');
      
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (financialId: number) => {
    if (!confirm('Are you sure you want to delete this financial record? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(financialId);
      const response = await fetch(`/api/financials/records?id=${financialId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete record');
      }

      // Remove the deleted record from the state
      setRecords(records.filter(record => record.FinancialID !== financialId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const downloadCSV = () => {
    if (records.length === 0) return;
    
    const headers = [
      'Property', 'Month', 'Gross Rent', 'Vacancy', 'Other Income', 'Total Income',
      'Repairs & Maintenance', 'Utilities', 'Property Management', 'Property Taxes',
      'Insurance', 'Marketing', 'Administrative', 'Total Expenses', 'NOI', 
      'Debt Service', 'Cash Flow', 'Occupancy %'
    ];
    
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        `"${record.PropertyName}"`,
        formatDate(record.ReportingMonth),
        record.GrossRent,
        record.Vacancy,
        record.OtherIncome,
        record.TotalIncome,
        record.RepairsMaintenance,
        record.Utilities,
        record.PropertyManagement,
        record.PropertyTaxes,
        record.Insurance,
        record.Marketing,
        record.Administrative,
        record.TotalExpenses,
        record.NOI,
        record.DebtService,
        record.CashFlow,
        record.Occupancy
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_data_${selectedYear}${selectedProperty ? `_${properties.find(p => p.PropertyID === selectedProperty)?.PropertyName}` : ''}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalIncome = records.reduce((sum, r) => sum + r.TotalIncome, 0);
  const totalExpenses = records.reduce((sum, r) => sum + r.TotalExpenses, 0);
  const totalNOI = records.reduce((sum, r) => sum + r.NOI, 0);
  const totalCashFlow = records.reduce((sum, r) => sum + r.CashFlow, 0);
  const avgVacancy = records.length > 0 ? records.reduce((sum, r) => sum + r.Vacancy, 0) / records.length : 0;

  return (
    <div className="content-card">
      <h4 className="mb-4">📋 Monthly Performance Data Management</h4>
      
      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label">Year</label>
          <select 
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Property Filter</label>
          <select 
            className="form-select"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value ? parseInt(e.target.value) : '')}
          >
            <option value="">All Properties</option>
            {properties.map(prop => (
              <option key={prop.PropertyID} value={prop.PropertyID}>
                {prop.PropertyName}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-5 d-flex align-items-end">
          <button className="btn btn-trea me-2" onClick={downloadCSV} disabled={records.length === 0}>
            <i className="fas fa-download"></i> Export to CSV
          </button>
          <button className="btn btn-trea-outline" onClick={fetchRecords} disabled={loading}>
            <i className="fas fa-refresh"></i> Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="metric-card">
              <div className="metric-value">{records.length}</div>
              <div className="metric-label">Total Records</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="metric-card">
              <div className="metric-value">{formatCurrency(totalIncome)}</div>
              <div className="metric-label">Total Income</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="metric-card">
              <div className="metric-value">{formatCurrency(totalNOI)}</div>
              <div className="metric-label">Total NOI</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="metric-card">
              <div className="metric-value">{formatCurrency(totalCashFlow)}</div>
              <div className="metric-label">Total Cash Flow</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <h6 className="alert-heading">Error</h6>
          <p className="mb-0">{error}</p>
          <button className="btn btn-outline-danger btn-sm mt-2" onClick={fetchRecords}>
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">No Data Found</h5>
          <p>No financial records found for the selected criteria. Try selecting a different year or property, or add some financial data using the Monthly Financials tab.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Property</th>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>NOI</th>
                <th>Cash Flow</th>
                <th>Vacancy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.FinancialID}>
                  <td><strong>{record.PropertyName}</strong></td>
                  <td>{formatDate(record.ReportingMonth)}</td>
                  <td className="text-success">{formatCurrency(record.TotalIncome)}</td>
                  <td className="text-danger">{formatCurrency(record.TotalExpenses)}</td>
                  <td className={record.NOI >= 0 ? 'text-success' : 'text-danger'}>
                    {formatCurrency(record.NOI)}
                  </td>
                  <td className={record.CashFlow >= 0 ? 'text-success' : 'text-danger'}>
                    {formatCurrency(record.CashFlow)}
                  </td>
                  <td>
                    <span className={record.Vacancy <= 5 ? 'text-success' : record.Vacancy <= 10 ? 'text-warning' : 'text-danger'}>
                      {record.Vacancy.toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(record.FinancialID)}
                      disabled={deleteLoading === record.FinancialID}
                      title="Delete record"
                    >
                      {deleteLoading === record.FinancialID ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-secondary">
              <tr>
                <th colSpan={2}>TOTALS</th>
                <th className="text-success">{formatCurrency(totalIncome)}</th>
                <th className="text-danger">{formatCurrency(totalExpenses)}</th>
                <th className={totalNOI >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(totalNOI)}</th>
                <th className={totalCashFlow >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(totalCashFlow)}</th>
                <th>
                  <span className={avgVacancy <= 5 ? 'text-success' : avgVacancy <= 10 ? 'text-warning' : 'text-danger'}>
                    {avgVacancy.toFixed(1)}%
                  </span>
                </th>
                <th></th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Detailed View Modal could be added here */}
      <div className="mt-4">
        <small className="text-muted">
          💡 Tip: Use the filters above to narrow down your view, and click the export button to download your data as CSV.
          Records can be deleted using the trash icon, but this action cannot be undone.
        </small>
      </div>
    </div>
  );
}