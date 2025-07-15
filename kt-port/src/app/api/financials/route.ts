import { NextRequest, NextResponse } from 'next/server';
import { importMonthlyFinancials } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, reportingMonth, ...financialData } = body;

    if (!propertyId || !reportingMonth) {
      return NextResponse.json(
        { error: 'Property ID and reporting month are required' },
        { status: 400 }
      );
    }

    const success = await importMonthlyFinancials(
      propertyId,
      new Date(reportingMonth),
      financialData
    );

    if (success) {
      return NextResponse.json({ success: true, message: 'Financial data saved successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to save financial data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving financial data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save financial data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}