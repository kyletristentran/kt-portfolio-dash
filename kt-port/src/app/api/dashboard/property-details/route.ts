import { NextRequest, NextResponse } from 'next/server';
import { getPropertyDetails } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    const propertyDetails = await getPropertyDetails(year);
    return NextResponse.json(propertyDetails);
  } catch (error) {
    console.error('Error fetching property details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch property details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}