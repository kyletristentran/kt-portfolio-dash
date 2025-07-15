'use client';

import { useState, useEffect } from 'react';

interface Property {
  PropertyID: number;
  PropertyName: string;
}

interface FinancialFormData {
  propertyId: number | '';
  reportingMonth: string;
  grossRent: number;
  vacancy: number;
  otherIncome: number;
  repairsMaintenance: number;
  utilities: number;
  propertyManagement: number;
  propertyTaxes: number;
  insurance: number;
  marketing: number;
  administrative: number;
  debtService: number;
  occupancy: number;
}

export default function MonthlyFinancials() {
  const [activeTab, setActiveTab] = useState('manual');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FinancialFormData>({
    propertyId: '',
    reportingMonth: new Date().toISOString().slice(0, 7), // Current month
    grossRent: 0,
    vacancy: 0,
    otherIncome: 0,
    repairsMaintenance: 0,
    utilities: 0,
    propertyManagement: 0,
    propertyTaxes: 0,
    insurance: 0,
    marketing: 0,
    administrative: 0,
    debtService: 0,
    occupancy: 95,
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      setError('Failed to load properties');
    }
  };

  const handleInputChange = (field: keyof FinancialFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
    setSuccess(null);
  };

  // Auto-calculate totals
  const totalIncome = formData.grossRent - formData.vacancy + formData.otherIncome;
  const totalExpenses = formData.repairsMaintenance + formData.utilities + formData.propertyManagement + 
                       formData.propertyTaxes + formData.insurance + formData.marketing + formData.administrative;
  const noi = totalIncome - totalExpenses;
  const cashFlow = noi - formData.debtService;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        propertyId: formData.propertyId,
        reportingMonth: formData.reportingMonth,
        GrossRent: formData.grossRent,
        Vacancy: formData.vacancy,
        OtherIncome: formData.otherIncome,
        TotalIncome: totalIncome,
        RepairsMaintenance: formData.repairsMaintenance,
        Utilities: formData.utilities,
        PropertyManagement: formData.propertyManagement,
        PropertyTaxes: formData.propertyTaxes,
        Insurance: formData.insurance,
        Marketing: formData.marketing,
        Administrative: formData.administrative,
        TotalExpenses: totalExpenses,
        NOI: noi,
        DebtService: formData.debtService,
        CashFlow: cashFlow,
        Occupancy: formData.occupancy,
      };

      const response = await fetch('/api/financials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save financial data');
      }

      setSuccess('Financial data saved successfully!');
      
      // Reset form
      setFormData({
        ...formData,
        grossRent: 0,
        vacancy: 0,
        otherIncome: 0,
        repairsMaintenance: 0,
        utilities: 0,
        propertyManagement: 0,
        propertyTaxes: 0,
        insurance: 0,
        marketing: 0,
        administrative: 0,
        debtService: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save financial data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      propertyId: '',
      reportingMonth: new Date().toISOString().slice(0, 7),
      grossRent: 0,
      vacancy: 0,
      otherIncome: 0,
      repairsMaintenance: 0,
      utilities: 0,
      propertyManagement: 0,
      propertyTaxes: 0,
      insurance: 0,
      marketing: 0,
      administrative: 0,
      debtService: 0,
      occupancy: 95,
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="content-card">
      <h4 className="mb-4">💰 Monthly Financials Management</h4>
      
      {/* Sub-tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            📝 Manual Entry
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'csv' ? 'active' : ''}`}
            onClick={() => setActiveTab('csv')}
          >
            📁 CSV Import
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📊 Financial History
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'manual' && (
        <div>
          <h5 className="mb-3">Manual Financial Data Entry</h5>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Property and Date Selection */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Select Property</label>
                <select 
                  className="form-select"
                  value={formData.propertyId}
                  onChange={(e) => handleInputChange('propertyId', parseInt(e.target.value) || '')}
                  required
                >
                  <option value="">Choose property...</option>
                  {properties.map(prop => (
                    <option key={prop.PropertyID} value={prop.PropertyID}>
                      {prop.PropertyName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Reporting Month</label>
                <input 
                  type="month" 
                  className="form-control"
                  value={formData.reportingMonth}
                  onChange={(e) => handleInputChange('reportingMonth', e.target.value)}
                  required 
                />
              </div>
            </div>

            {/* Income Section */}
            <h5 className="mb-3">💰 Income</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label">Gross Rent ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.grossRent}
                  onChange={(e) => handleInputChange('grossRent', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Vacancy Loss ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.vacancy}
                  onChange={(e) => handleInputChange('vacancy', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Other Income ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.otherIncome}
                  onChange={(e) => handleInputChange('otherIncome', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Expenses Section */}
            <h5 className="mb-3">💸 Expenses</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label">Repairs & Maintenance ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.repairsMaintenance}
                  onChange={(e) => handleInputChange('repairsMaintenance', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Utilities ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.utilities}
                  onChange={(e) => handleInputChange('utilities', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Property Management ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.propertyManagement}
                  onChange={(e) => handleInputChange('propertyManagement', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Property Taxes ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.propertyTaxes}
                  onChange={(e) => handleInputChange('propertyTaxes', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Insurance ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.insurance}
                  onChange={(e) => handleInputChange('insurance', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Marketing ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.marketing}
                  onChange={(e) => handleInputChange('marketing', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Administrative ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.administrative}
                  onChange={(e) => handleInputChange('administrative', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Debt Service ($)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={formData.debtService}
                  onChange={(e) => handleInputChange('debtService', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Occupancy (%)</label>
                <input 
                  type="number" 
                  className="form-control"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.occupancy}
                  onChange={(e) => handleInputChange('occupancy', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Calculated Metrics */}
            <h5 className="mb-3">📊 Calculated Metrics</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="alert alert-info">
                  <strong>Total Income:</strong> ${totalIncome.toFixed(2)}
                </div>
              </div>
              <div className="col-md-3">
                <div className="alert alert-warning">
                  <strong>Total Expenses:</strong> ${totalExpenses.toFixed(2)}
                </div>
              </div>
              <div className="col-md-3">
                <div className={`alert ${noi >= 0 ? 'alert-success' : 'alert-danger'}`}>
                  <strong>NOI:</strong> ${noi.toFixed(2)}
                </div>
              </div>
              <div className="col-md-3">
                <div className={`alert ${cashFlow >= 0 ? 'alert-success' : 'alert-danger'}`}>
                  <strong>Cash Flow:</strong> ${cashFlow.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-3">
              <button 
                type="submit" 
                className="btn btn-trea"
                disabled={loading || !formData.propertyId}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i> Save Financial Data
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-trea-outline"
                onClick={resetForm}
                disabled={loading}
              >
                <i className="fas fa-undo"></i> Reset Form
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'csv' && (
        <CSVImportTab 
          properties={properties} 
          onImportSuccess={() => {
            setSuccess('CSV data imported successfully!');
            setActiveTab('manual');
          }}
          onImportError={(error) => setError(error)}
        />
      )}

      {activeTab === 'history' && (
        <FinancialHistoryTab properties={properties} />
      )}
    </div>
  );
}

// CSV Import Component
interface CSVImportTabProps {
  properties: Property[];
  onImportSuccess: () => void;
  onImportError: (error: string) => void;
}

function CSVImportTab({ properties, onImportSuccess, onImportError }: CSVImportTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const downloadTemplate = () => {
    const headers = [
      'PropertyID', 'ReportingMonth', 'GrossRent', 'Vacancy', 'OtherIncome',
      'RepairsMaintenance', 'Utilities', 'PropertyManagement', 'PropertyTaxes',
      'Insurance', 'Marketing', 'Administrative', 'DebtService', 'Occupancy'
    ];
    
    const sampleData = [
      '1', '2024-01', '5000', '250', '100', '200', '150', '400', '300', '200', '50', '100', '2000', '95'
    ];
    
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_data_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      previewCSV(selectedFile);
    }
  };

  const previewCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1, 4).map(line => 
        line.split(',').reduce((obj: any, val, index) => {
          obj[headers[index]] = val.trim();
          return obj;
        }, {})
      );
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });

          // Validate required fields
          if (!row.PropertyID || !row.ReportingMonth) continue;

          // Calculate totals
          const grossRent = parseFloat(row.GrossRent) || 0;
          const vacancy = parseFloat(row.Vacancy) || 0;
          const otherIncome = parseFloat(row.OtherIncome) || 0;
          const totalIncome = grossRent - vacancy + otherIncome;

          const repairsMaintenance = parseFloat(row.RepairsMaintenance) || 0;
          const utilities = parseFloat(row.Utilities) || 0;
          const propertyManagement = parseFloat(row.PropertyManagement) || 0;
          const propertyTaxes = parseFloat(row.PropertyTaxes) || 0;
          const insurance = parseFloat(row.Insurance) || 0;
          const marketing = parseFloat(row.Marketing) || 0;
          const administrative = parseFloat(row.Administrative) || 0;
          const totalExpenses = repairsMaintenance + utilities + propertyManagement + 
                               propertyTaxes + insurance + marketing + administrative;
          const noi = totalIncome - totalExpenses;
          const debtService = parseFloat(row.DebtService) || 0;
          const cashFlow = noi - debtService;

          const payload = {
            propertyId: parseInt(row.PropertyID),
            reportingMonth: row.ReportingMonth,
            GrossRent: grossRent,
            Vacancy: vacancy,
            OtherIncome: otherIncome,
            TotalIncome: totalIncome,
            RepairsMaintenance: repairsMaintenance,
            Utilities: utilities,
            PropertyManagement: propertyManagement,
            PropertyTaxes: propertyTaxes,
            Insurance: insurance,
            Marketing: marketing,
            Administrative: administrative,
            TotalExpenses: totalExpenses,
            NOI: noi,
            DebtService: debtService,
            CashFlow: cashFlow,
            Occupancy: parseFloat(row.Occupancy) || 95,
          };

          const response = await fetch('/api/financials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Failed to import row ${i}: ${response.statusText}`);
          }
        }
        
        onImportSuccess();
        setFile(null);
        setPreview([]);
      };
      reader.readAsText(file);
    } catch (err) {
      onImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h5 className="mb-3">CSV File Import</h5>
      
      <div className="alert alert-info">
        <h6>📋 CSV Template Format</h6>
        <p>Your CSV should include the following columns in order:</p>
        <small className="text-muted">
          PropertyID, ReportingMonth (YYYY-MM), GrossRent, Vacancy, OtherIncome, RepairsMaintenance, 
          Utilities, PropertyManagement, PropertyTaxes, Insurance, Marketing, Administrative, DebtService, Occupancy
        </small>
        <div className="mt-2">
          <button className="btn btn-sm btn-trea" onClick={downloadTemplate}>
            <i className="fas fa-download"></i> Download Template
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Upload CSV File</label>
        <input 
          type="file" 
          className="form-control" 
          accept=".csv" 
          onChange={handleFileChange}
          disabled={importing}
        />
      </div>

      {preview.length > 0 && (
        <div className="mb-3">
          <h6>Preview (first 3 rows):</h6>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  {Object.keys(preview[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value: any, i) => (
                      <td key={i}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button 
        className="btn btn-trea" 
        onClick={handleImport}
        disabled={!file || importing}
      >
        {importing ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Importing...
          </>
        ) : (
          <>
            <i className="fas fa-upload"></i> Import Financial Data
          </>
        )}
      </button>
    </div>
  );
}

// Financial History Component
interface FinancialHistoryTabProps {
  properties: Property[];
}

function FinancialHistoryTab({ properties }: FinancialHistoryTabProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchHistory();
  }, [selectedProperty, selectedYear]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      if (selectedProperty) {
        params.append('propertyId', selectedProperty.toString());
      }

      const response = await fetch(`/api/financials/records?${params}`);
      if (!response.ok) throw new Error('Failed to fetch records');
      
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div>
      <h5 className="mb-3">Financial History Viewer</h5>
      
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label">Property</label>
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
        <div className="col-md-4">
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
        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-trea-outline" onClick={fetchHistory} disabled={loading}>
            <i className="fas fa-refresh"></i> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="alert alert-info">
          <p>No financial records found for the selected criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead className="table-dark">
              <tr>
                <th>Property</th>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>NOI</th>
                <th>Cash Flow</th>
                <th>Vacancy</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}