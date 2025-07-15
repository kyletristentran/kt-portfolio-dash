import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyFinancialRecords, deleteMonthlyFinancialRecord } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const propertyId = searchParams.get('propertyId') ? parseInt(searchParams.get('propertyId')!) : undefined;

    if (year && (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    if (propertyId && isNaN(propertyId)) {
      return NextResponse.json(
        { error: 'Invalid property ID parameter' },
        { status: 400 }
      );
    }

    const records = await getMonthlyFinancialRecords(year, propertyId);
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching financial records:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch financial records',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const financialId = searchParams.get('id');

    if (!financialId || isNaN(parseInt(financialId))) {
      return NextResponse.json(
        { error: 'Valid financial ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteMonthlyFinancialRecord(parseInt(financialId));
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Record deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting financial record:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete record',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}