import sql from 'mssql';

// Database configuration matching your original HTML dashboard
const dbConfig: sql.config = {
  server: "kyletristentran.database.windows.net",
  database: "MultifamilyRealEstateDB",
  user: "kyletristentran",
  password: "Tran1105",
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

// Connection pool
let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool || !pool.connected) {
    try {
      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();
      console.log('Connected to Azure SQL Database');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
  return pool;
}

export async function testConnection(): Promise<{ success: boolean; message: string; tableCount?: number }> {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT COUNT(*) as table_count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    return {
      success: true,
      message: 'Database connection successful',
      tableCount: result.recordset[0].table_count
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

// Dashboard Data Queries
export interface DashboardKPIs {
  total_portfolio_value: number;
  total_revenue: number;
  total_expenses: number;
  total_noi: number;
  avg_vacancy: number;
  property_count: number;
  noi_variance: number;
  revenue_variance: number;
  prev_noi: number;
  prev_revenue: number;
}

export async function getPortfolioKPIs(year: number): Promise<DashboardKPIs> {
  try {
    const pool = await getConnection();
    
    // Current year YTD metrics
    const currentQuery = `
      SELECT 
        ISNULL(SUM(TotalIncome), 0) as total_revenue,
        ISNULL(SUM(TotalExpenses), 0) as total_expenses,
        ISNULL(SUM(NOI), 0) as total_noi,
        CASE 
          WHEN AVG(Vacancy) > 100 THEN AVG(Vacancy) / 100
          WHEN AVG(Vacancy) < 0 THEN 0
          ELSE ISNULL(AVG(Vacancy), 0)
        END as avg_vacancy,
        COUNT(DISTINCT PropertyID) as property_count
      FROM dbo.MonthlyFinancials mf
      WHERE YEAR(ReportingMonth) = @year AND MONTH(ReportingMonth) <= MONTH(GETDATE())
    `;
    
    const currentResult = await pool.request()
      .input('year', sql.Int, year)
      .query(currentQuery);
    
    // Previous year same period for variance calculation
    const prevYearQuery = `
      SELECT 
        ISNULL(SUM(NOI), 0) as prev_noi,
        ISNULL(SUM(TotalIncome), 0) as prev_revenue
      FROM dbo.MonthlyFinancials mf
      WHERE YEAR(ReportingMonth) = @prevYear AND MONTH(ReportingMonth) <= MONTH(GETDATE())
    `;
    
    const prevResult = await pool.request()
      .input('prevYear', sql.Int, year - 1)
      .query(prevYearQuery);
    
    // Property values for portfolio value calculation
    const portfolioQuery = `
      SELECT ISNULL(SUM(PurchasePrice), 0) as total_portfolio_value
      FROM dbo.Properties
    `;
    
    const portfolioResult = await pool.request().query(portfolioQuery);
    
    const current = currentResult.recordset[0];
    const prev = prevResult.recordset[0];
    const portfolio = portfolioResult.recordset[0];
    
    // Calculate variances
    const noi_variance = prev.prev_noi !== 0 
      ? ((current.total_noi - prev.prev_noi) / prev.prev_noi * 100) 
      : 0;
    
    const revenue_variance = prev.prev_revenue !== 0 
      ? ((current.total_revenue - prev.prev_revenue) / prev.prev_revenue * 100) 
      : 0;
    
    return {
      total_portfolio_value: portfolio.total_portfolio_value || 0,
      total_revenue: current.total_revenue || 0,
      total_expenses: current.total_expenses || 0,
      total_noi: current.total_noi || 0,
      avg_vacancy: Math.min(Math.max(current.avg_vacancy || 0, 0), 100),
      property_count: current.property_count || 0,
      noi_variance,
      revenue_variance,
      prev_noi: prev.prev_noi || 0,
      prev_revenue: prev.prev_revenue || 0
    };
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    throw error;
  }
}

export interface MonthlyPerformance {
  ReportingMonth: Date;
  Revenue: number;
  Expenses: number;
  NOI: number;
  CashFlow: number;
  Vacancy: number;
}

export async function getMonthlyPerformance(year: number): Promise<MonthlyPerformance[]> {
  try {
    const pool = await getConnection();
    
    const query = `
      SELECT 
        ReportingMonth,
        ISNULL(SUM(TotalIncome), 0) as Revenue,
        ISNULL(SUM(TotalExpenses), 0) as Expenses,
        ISNULL(SUM(NOI), 0) as NOI,
        ISNULL(SUM(CashFlow), 0) as CashFlow,
        CASE 
          WHEN AVG(Vacancy) > 100 THEN AVG(Vacancy) / 100
          WHEN AVG(Vacancy) < 0 THEN 0
          ELSE ISNULL(AVG(Vacancy), 0)
        END as Vacancy
      FROM dbo.MonthlyFinancials
      WHERE YEAR(ReportingMonth) = @year
      GROUP BY ReportingMonth
      ORDER BY ReportingMonth
    `;
    
    const result = await pool.request()
      .input('year', sql.Int, year)
      .query(query);
    
    return result.recordset;
  } catch (error) {
    console.error('Error fetching monthly performance:', error);
    throw error;
  }
}

export interface PropertyDetail {
  PropertyID: number;
  PropertyName: string;
  PurchasePrice: number;
  TotalUnits: number;
  TotalRevenue: number;
  TotalExpenses: number;
  TotalNOI: number;
  AvgVacancy: number;
  MonthsReported: number;
}

export async function getPropertyDetails(year: number): Promise<PropertyDetail[]> {
  try {
    const pool = await getConnection();
    
    const query = `
      SELECT 
        p.PropertyID,
        p.PropertyName,
        p.PurchasePrice,
        p.UnitCount as TotalUnits,
        COALESCE(SUM(mf.TotalIncome), 0) as TotalRevenue,
        COALESCE(SUM(mf.TotalExpenses), 0) as TotalExpenses,
        COALESCE(SUM(mf.NOI), 0) as TotalNOI,
        CASE 
          WHEN AVG(mf.Vacancy) > 100 THEN AVG(mf.Vacancy) / 100
          WHEN AVG(mf.Vacancy) < 0 THEN 0
          ELSE COALESCE(AVG(mf.Vacancy), 0)
        END as AvgVacancy,
        COUNT(DISTINCT mf.ReportingMonth) as MonthsReported
      FROM dbo.Properties p
      LEFT JOIN dbo.MonthlyFinancials mf ON p.PropertyID = mf.PropertyID
        AND YEAR(mf.ReportingMonth) = @year
      GROUP BY p.PropertyID, p.PropertyName, p.PurchasePrice, p.UnitCount
      ORDER BY p.PropertyName
    `;
    
    const result = await pool.request()
      .input('year', sql.Int, year)
      .query(query);
    
    return result.recordset.map(row => ({
      ...row,
      AvgVacancy: Math.min(Math.max(row.AvgVacancy, 0), 100)
    }));
  } catch (error) {
    console.error('Error fetching property details:', error);
    throw error;
  }
}

export interface Property {
  PropertyID: number;
  PropertyName: string;
}

export async function getPropertyList(): Promise<Property[]> {
  try {
    const pool = await getConnection();
    
    const query = `
      SELECT PropertyID, PropertyName 
      FROM dbo.Properties 
      ORDER BY PropertyName
    `;
    
    const result = await pool.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error fetching property list:', error);
    throw error;
  }
}

export interface FinancialData {
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
  FilePath?: string;
}

export async function importMonthlyFinancials(
  propertyId: number, 
  reportingMonth: Date, 
  data: FinancialData
): Promise<boolean> {
  try {
    const pool = await getConnection();
    
    // Check if record exists
    const checkQuery = `
      SELECT FinancialID FROM dbo.MonthlyFinancials 
      WHERE PropertyID = @propertyId AND ReportingMonth = @reportingMonth
    `;
    
    const checkResult = await pool.request()
      .input('propertyId', sql.Int, propertyId)
      .input('reportingMonth', sql.Date, reportingMonth)
      .query(checkQuery);
    
    if (checkResult.recordset.length > 0) {
      // Update existing record
      const financialId = checkResult.recordset[0].FinancialID;
      const updateQuery = `
        UPDATE dbo.MonthlyFinancials SET
          GrossRent = @grossRent, Vacancy = @vacancy, OtherIncome = @otherIncome, 
          TotalIncome = @totalIncome, RepairsMaintenance = @repairsMaintenance, 
          Utilities = @utilities, PropertyManagement = @propertyManagement,
          PropertyTaxes = @propertyTaxes, Insurance = @insurance, Marketing = @marketing, 
          Administrative = @administrative, TotalExpenses = @totalExpenses, NOI = @noi, 
          DebtService = @debtService, CashFlow = @cashFlow, Occupancy = @occupancy, 
          FilePath = @filePath
        WHERE FinancialID = @financialId
      `;
      
      await pool.request()
        .input('grossRent', sql.Decimal(18, 2), data.GrossRent)
        .input('vacancy', sql.Decimal(18, 2), data.Vacancy)
        .input('otherIncome', sql.Decimal(18, 2), data.OtherIncome)
        .input('totalIncome', sql.Decimal(18, 2), data.TotalIncome)
        .input('repairsMaintenance', sql.Decimal(18, 2), data.RepairsMaintenance)
        .input('utilities', sql.Decimal(18, 2), data.Utilities)
        .input('propertyManagement', sql.Decimal(18, 2), data.PropertyManagement)
        .input('propertyTaxes', sql.Decimal(18, 2), data.PropertyTaxes)
        .input('insurance', sql.Decimal(18, 2), data.Insurance)
        .input('marketing', sql.Decimal(18, 2), data.Marketing)
        .input('administrative', sql.Decimal(18, 2), data.Administrative)
        .input('totalExpenses', sql.Decimal(18, 2), data.TotalExpenses)
        .input('noi', sql.Decimal(18, 2), data.NOI)
        .input('debtService', sql.Decimal(18, 2), data.DebtService)
        .input('cashFlow', sql.Decimal(18, 2), data.CashFlow)
        .input('occupancy', sql.Decimal(5, 2), data.Occupancy)
        .input('filePath', sql.NVarChar(255), data.FilePath || 'Next.js Import')
        .input('financialId', sql.Int, financialId)
        .query(updateQuery);
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO dbo.MonthlyFinancials (
          PropertyID, ReportingMonth, GrossRent, Vacancy, OtherIncome, TotalIncome,
          RepairsMaintenance, Utilities, PropertyManagement, PropertyTaxes, Insurance,
          Marketing, Administrative, TotalExpenses, NOI, DebtService, CashFlow,
          Occupancy, FilePath
        ) VALUES (
          @propertyId, @reportingMonth, @grossRent, @vacancy, @otherIncome, @totalIncome,
          @repairsMaintenance, @utilities, @propertyManagement, @propertyTaxes, @insurance,
          @marketing, @administrative, @totalExpenses, @noi, @debtService, @cashFlow,
          @occupancy, @filePath
        )
      `;
      
      await pool.request()
        .input('propertyId', sql.Int, propertyId)
        .input('reportingMonth', sql.Date, reportingMonth)
        .input('grossRent', sql.Decimal(18, 2), data.GrossRent)
        .input('vacancy', sql.Decimal(18, 2), data.Vacancy)
        .input('otherIncome', sql.Decimal(18, 2), data.OtherIncome)
        .input('totalIncome', sql.Decimal(18, 2), data.TotalIncome)
        .input('repairsMaintenance', sql.Decimal(18, 2), data.RepairsMaintenance)
        .input('utilities', sql.Decimal(18, 2), data.Utilities)
        .input('propertyManagement', sql.Decimal(18, 2), data.PropertyManagement)
        .input('propertyTaxes', sql.Decimal(18, 2), data.PropertyTaxes)
        .input('insurance', sql.Decimal(18, 2), data.Insurance)
        .input('marketing', sql.Decimal(18, 2), data.Marketing)
        .input('administrative', sql.Decimal(18, 2), data.Administrative)
        .input('totalExpenses', sql.Decimal(18, 2), data.TotalExpenses)
        .input('noi', sql.Decimal(18, 2), data.NOI)
        .input('debtService', sql.Decimal(18, 2), data.DebtService)
        .input('cashFlow', sql.Decimal(18, 2), data.CashFlow)
        .input('occupancy', sql.Decimal(5, 2), data.Occupancy)
        .input('filePath', sql.NVarChar(255), data.FilePath || 'Next.js Import')
        .query(insertQuery);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing financial data:', error);
    throw error;
  }
}

export interface MonthlyFinancialRecord {
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

export async function getMonthlyFinancialRecords(year?: number, propertyId?: number): Promise<MonthlyFinancialRecord[]> {
  try {
    const pool = await getConnection();
    
    let whereClause = '';
    const inputs: { name: string; type: any; value: any }[] = [];
    
    if (year) {
      whereClause += ' WHERE YEAR(mf.ReportingMonth) = @year';
      inputs.push({ name: 'year', type: sql.Int, value: year });
    }
    
    if (propertyId) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' mf.PropertyID = @propertyId';
      inputs.push({ name: 'propertyId', type: sql.Int, value: propertyId });
    }
    
    const query = `
      SELECT 
        mf.FinancialID, mf.PropertyID, p.PropertyName, mf.ReportingMonth,
        mf.GrossRent, mf.Vacancy, mf.OtherIncome, mf.TotalIncome,
        mf.RepairsMaintenance, mf.Utilities, mf.PropertyManagement, mf.PropertyTaxes,
        mf.Insurance, mf.Marketing, mf.Administrative, mf.TotalExpenses,
        mf.NOI, mf.DebtService, mf.CashFlow, mf.Occupancy, mf.FilePath
      FROM dbo.MonthlyFinancials mf
      INNER JOIN dbo.Properties p ON mf.PropertyID = p.PropertyID
      ${whereClause}
      ORDER BY mf.ReportingMonth DESC, p.PropertyName
    `;
    
    const request = pool.request();
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error fetching monthly financial records:', error);
    throw error;
  }
}

export async function deleteMonthlyFinancialRecord(financialId: number): Promise<boolean> {
  try {
    const pool = await getConnection();
    
    const query = `DELETE FROM dbo.MonthlyFinancials WHERE FinancialID = @financialId`;
    
    await pool.request()
      .input('financialId', sql.Int, financialId)
      .query(query);
    
    return true;
  } catch (error) {
    console.error('Error deleting financial record:', error);
    throw error;
  }
}