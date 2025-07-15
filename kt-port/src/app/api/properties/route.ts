import { NextResponse } from 'next/server';
import { getPropertyList } from '@/lib/database';

export async function GET() {
  try {
    const properties = await getPropertyList();
    return NextResponse.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch properties',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}