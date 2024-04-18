'use client'
import React, { useEffect, useState } from 'react';
import { 
    MovieDb, 
    type MovieResult, 
    type PersonResult, 
    type PopularMoviesResponse, 
    type TopRatedMoviesResponse, 
    type TrendingResponse, 
    type TvResult, 
    type TvResultsResponse
} from 'moviedb-promise';
import Card from '@components/card';

const apiKey = process.env.TMDB_API_KEY ?? '';
const moviedb = new MovieDb(apiKey);

async function fetchTrending(): Promise<TrendingResponse | undefined> {
    return await moviedb.trending({
        media_type: 'all',
        time_window: 'week'
    });
};

async function fetchMoviesPopular(): Promise<PopularMoviesResponse | undefined> {
    return await moviedb.moviePopular();
};

async function fetchMoviesTopRated(): Promise<TopRatedMoviesResponse | undefined> {
    return await moviedb.movieTopRated();
};

async function fetchTvPopular(): Promise<TvResultsResponse | undefined> {
    return await moviedb.tvPopular();
};

async function fetchTvTopRated(): Promise<TvResultsResponse | undefined> {
    return await moviedb.tvTopRated();
};

export default function HomePage() {
  const [filter, setFilter] = useState('trending');
  const [result, setResult] = useState<(MovieResult | TvResult | PersonResult)[] | undefined>([]);

    useEffect(() => {
        switch(filter) {
            case 'trending':
                fetchTrending()
                .then((res: TrendingResponse | undefined) => { 
                    if(res) {
                        // Fetch top20 and shuffle the results for a varied response
                        const top20: (MovieResult | TvResult | PersonResult)[] | undefined = res.results?.slice(0, 20);
                        const shuffled: (MovieResult | TvResult | PersonResult)[] = top20?.sort(() => 0.5 - Math.random()) ?? [];
                        const trendingMovies: (MovieResult | TvResult | PersonResult)[] = shuffled.slice(0, 6);
                        setResult(trendingMovies);
                    }
                })
                .catch((error) => console.error(error));
                break;
            case 'moviesPopular':
                fetchMoviesPopular()
                .then((res: PopularMoviesResponse | undefined) => {
                    if(res) {
                        const top20: (MovieResult)[] | undefined = res.results?.slice(0, 20);
                        const shuffled: (MovieResult)[] = top20?.sort(() => 0.5 - Math.random()) ?? [];
                        const popularMovies: (MovieResult)[] = shuffled.slice(0, 6);
                        setResult(popularMovies);
                    }
                })
                .catch((error) => console.error(error));
                break;
            case 'moviesTopRated':
                fetchMoviesTopRated()
                .then((res: TopRatedMoviesResponse | undefined) => {
                    if(res) {
                        const top20: (MovieResult)[] | undefined = res.results?.slice(0, 20);
                        const shuffled: (MovieResult)[] = top20?.sort(() => 0.5 - Math.random()) ?? [];
                        const topRatedMovies: (MovieResult)[] = shuffled.slice(0, 6);
                        setResult(topRatedMovies);
                    }
                })
                .catch((error) => console.error(error));
                break;
            case 'tvPopular':
                fetchTvPopular()
                .then((res: TvResultsResponse | undefined) => {
                    if(res) {
                        const top20: (TvResult)[] | undefined = res.results?.slice(0, 20);
                        const shuffled: (TvResult)[] = top20?.sort(() => 0.5 - Math.random()) ?? [];
                        const popularTv: (TvResult)[] = shuffled.slice(0, 6);
                        setResult(popularTv);
                    }
                })
                .catch((error) => console.error(error));
                break;
            case 'tvTopRated':
                fetchTvTopRated()
                .then((res: TvResultsResponse | undefined) => {
                    if(res) {
                        const top20: (TvResult)[] | undefined = res.results?.slice(0, 20);
                        const shuffled: (TvResult)[] = top20?.sort(() => 0.5 - Math.random()) ?? [];
                        const topRatedTv: (TvResult)[] = shuffled.slice(0, 6);
                        setResult(topRatedTv);
                    }
                })
                .catch((error) => console.error(error));
                break;
            default:
                break;
        }
    }, [filter]);

    const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setFilter(event.target.value);
    };

    return (
        <main>
            <div className="bg-gradient-to-b from-emerald-700/90 to-teal-700/90 border-slate-800 border-t-y">
                <div className="container mx-auto px-4">
                    <div className="p-4 flex gap-4 justify-center">
                        <span className="text-white">Filter</span>
                        <select className="rounded" value={filter} onChange={handleFilterChange}>
                            <option value="trending">Trending</option>
                            <option value="moviesPopular">Movies - Popular</option>
                            <option value="moviesTopRated">Movies - Top Rated</option>
                            <option value="tvPopular">TV Shows - Popular</option>
                            <option value="tvTopRated">TV Shows - Top Rated</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-3 gap-4 py-2">
                    {result?.map((res: MovieResult | TvResult | PersonResult) => {
                        let name = '';
                        if ('title' in res && res.title) {
                            name = res.title;
                        } else if ('name' in res && res.name) {
                            name = res.name;
                        }

                        let description = '';
                        if ('overview' in res && res.overview) {
                            description = res.overview;
                        }

                        return (
                            <Card
                                key={res.id}
                                movie={{
                                    id: res.id,
                                    name: name,
                                    description: description,
                                    imageUrl: `https://image.tmdb.org/t/p/w500${res.poster_path}`,
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        </main>
    );
};