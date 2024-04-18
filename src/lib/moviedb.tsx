import { MovieDb, TrendingResponse } from 'moviedb-promise';

const moviedb = new MovieDb('72554b3efe9685879faae3aa92b4b499');

async function fetchTrendingMovies(): Promise<TrendingResponse> {
    return await moviedb.trending({
        media_type: 'movie',
        time_window: 'week'
    })
};

export default fetchTrendingMovies();
