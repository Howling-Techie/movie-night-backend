const client = require("../database/connection");
const axios = require("axios");
const {verifyToken} = require("./utils.model");

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

exports.selectMovieSubmissions = async (params, headers) => {
    const {movie_id} = params;
    if (!movie_id) {
        return Promise.reject({status: 400, msg: "Movie ID not provided"});
    }
    if (Number.isNaN(+movie_id)) {
        return Promise.reject({status: 400, msg: "Invalid movie_id datatype"});
    }

    const tokenHeader = headers["authorization"];
    const token = tokenHeader ? tokenHeader.split(" ")[1] : null;
    let submissions = [];
    if (token) {
        const decoded = await verifyToken(token);
        if (!decoded) {
            return Promise.reject({status: 401, msg: "Unauthorized"});
        }
        const submissionResults = await client.query(`SELECT s.*
                                                      FROM submissions s
                                                               INNER JOIN submission_movies sm on s.id = sm.submission_id
                                                               INNER JOIN servers se on s.server_id = se.id
                                                               LEFT JOIN server_users su on se.id = su.server_id AND su.user_id = $2
                                                      WHERE sm.movie_id = $1
                                                        AND (se.visibility = 0 OR su.user_id = $2)
        `, [movie_id, id]);
        submissions = submissionResults.rows;
    } else {
        const submissionResults = await client.query(`SELECT s.*
                                                      FROM submissions s
                                                               INNER JOIN submission_movies sm on s.id = sm.submission_id
                                                               INNER JOIN servers se on s.server_id = se.id
                                                      WHERE sm.movie_id = $1
                                                        AND se.visibility = 0`, [movie_id]);
        submissions = submissionResults.rows;
    }
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
    return movies.map(movie => ({
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        description: movie.overview,
        poster: movie.poster_path,
        image: movie.backdrop_path,
        genres: movie.genre_ids.map(id => genres.find(genre => genre.genre_id === id))
    }));
};

exports.selectMovieImagesById = async (params, headers) => {
    const {movie_id} = params;
    if (!movie_id) {
        return Promise.reject({status: 400, msg: "Movie ID not provided"});
    }
    if (Number.isNaN(+movie_id)) {
        return Promise.reject({status: 400, msg: "Invalid movie_id datatype"});
    }
    const options = {
        method: "GET",
        url: `https://api.themoviedb.org/3/movie/${movie_id}/images`,
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.TMDB_AUTH}`
        }
    };
    const results = await axios
        .request(options);
    const images = results.data;
    return {images: images.backdrops.map(b => b.file_path), posters: images.posters.map(p => p.file_path)};

};

// DELETE
exports.deleteMovie = async (params, headers) => {

};

