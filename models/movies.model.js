const client = require("../database/connection");
const axios = require("axios");

// SELECT
exports.selectMovie = async (params) => {
    const {movie_id} = params;
    if (!movie_id) {
        return Promise.reject({status: 400, msg: "Movie ID not provided"});
    }
    if (Number.isNaN(+movie_id)) {
        return Promise.reject({status: 400, msg: "Invalid movie_id datatype"});
    }
    const results = await client.query(`SELECT *
                                        FROM movies
                                        WHERE id = $1`, [movie_id]);

    if (results.rows.length === 0) {
        return Promise.reject({status: 404, msg: "Movie not found"});
    }
    return results.rows[0];
};

exports.selectMovieSubmissions = async (params) => {
    const {movie_id} = params;
    if (!movie_id) {
        return Promise.reject({status: 400, msg: "Movie ID not provided"});
    }
    if (Number.isNaN(+movie_id)) {
        return Promise.reject({status: 400, msg: "Invalid movie_id datatype"});
    }
    const submissionResults = await client.query(`SELECT s.*
                                                  FROM submissions s
                                                           INNER JOIN submission_movies sm on s.id = sm.submission_id
                                                  WHERE sm.movie_id = $1`, [movie_id]);
    if (submissionResults.rows.length === 0) {
        return Promise.reject({status: 404, msg: "Movie not found"});
    }
    const submissions = submissionResults.rows;
    for (const submission of submissions) {
        const userResult = await client.query(`SELECT *
                                               FROM users u
                                               WHERE u.id = $1`, [submission.user_id]);
        submission.user = userResult.rows[0];
    }
    return submissions;
};

exports.selectMovies = async (queries) => {
    const {topic, sort_by = "title", order = "asc", limit = 20, p = 1} = queries;

    if (!(order === "asc" || order === "desc")) {
        return Promise.reject({status: 400, msg: "Invalid order"});
    }
    const validSorts = ["title", "release_date", "duration"];
    if (!validSorts.includes(sort_by)) {
        return Promise.reject({status: 400, msg: "Invalid sort_by"});
    }
    const results = await client.query(`SELECT *
                                        FROM movies
                                        ORDER BY ${sort_by} ${order}
                                        LIMIT ${limit} OFFSET ${limit * (p - 1)}`);
    return results.rows;
};

exports.searchMovies = async (queries, headers) => {
    const genreTable = await client.query(`SELECT *
                                           FROM genres`);
    const genres = genreTable.rows;
    const {searchTerm, year} = queries;
    const results = await axios.get(`https://api.themoviedb.org/3/search/movie?query=${searchTerm}${year ? `&year=${year}` : ""}&api_key=${process.env.TMDB_KEY}`);
    const movies = results.data.results;
    const movieData = movies.map(movie => ({
        imdb_id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        description: movie.overview,
        poster: movie.poster_path,
        image: movie.backdrop_path,
        genres: movie.genre_ids.map(id => genres.find(genre => genre.genre_id === id))
    }));
    return movieData;
};

// DELETE
exports.deleteMovie = async (params, headers) => {

};

