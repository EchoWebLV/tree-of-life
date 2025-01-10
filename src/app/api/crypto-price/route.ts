import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin')?.toLowerCase() || 'bitcoin';

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch price data');
    }

    const data = await response.json();
    
    if (!data[coin]) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: coin,
      price_usd: data[coin].usd,
      price_change_24h: data[coin].usd_24h_change,
      market_cap: data[coin].usd_market_cap
    });
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
} 