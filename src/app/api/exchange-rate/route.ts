import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get('base')?.toUpperCase() || 'USD';
    const target = searchParams.get('target')?.toUpperCase() || 'EUR';

    const response = await fetch(
      `https://open.er-api.com/v6/latest/${base}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate data');
    }

    const data = await response.json();
    
    if (!data.rates || !data.rates[target]) {
      return NextResponse.json(
        { error: 'Currency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      base,
      target,
      rate: data.rates[target],
      last_updated: data.time_last_update_utc
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate data' },
      { status: 500 }
    );
  }
} 