import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Inception';
    const apiKey = process.env.OMDB_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch movie data');
    }

    const data = await response.json();

    if (data.Response === 'False') {
      return NextResponse.json(
        { error: data.Error || 'Movie not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      title: data.Title,
      year: data.Year,
      rated: data.Rated,
      runtime: data.Runtime,
      genre: data.Genre,
      director: data.Director,
      actors: data.Actors,
      plot: data.Plot,
      ratings: data.Ratings,
      poster: data.Poster,
      imdb_rating: data.imdbRating
    });
  } catch (error) {
    console.error('Error fetching movie data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie data' },
      { status: 500 }
    );
  }
} 