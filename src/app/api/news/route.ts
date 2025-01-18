import { NextResponse } from 'next/server';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'crypto';
    const apiKey = process.env.NEWSAPI_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch news data');
    }

    const data = await response.json();

    return NextResponse.json({
      articles: data.articles.map((article: NewsArticle) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name
      }))
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news data' },
      { status: 500 }
    );
  }
} 