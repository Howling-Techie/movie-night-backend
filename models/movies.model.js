const client = require("../database/connection");
const {MovieDb} = require("moviedb-promise");

const moviedb = new MovieDb(process.env.TMDB_KEY);
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
                                        WHERE movie_id = $1`, [movie_id]);

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
                                                           INNER JOIN submission_movies sm on s.submission_id = sm.submission_id
                                                  WHERE sm.movie_id = $1`, [movie_id]);
    if (submissionResults.rows.length === 0) {
        return Promise.reject({status: 404, msg: "Movie not found"});
    }
    const submissions = submissionResults.rows;
    for (const submission of submissions) {
        const userResult = await client.query(`SELECT *
                                               FROM users u
                                               WHERE u.user_id = $1`, [submission.user_id]);
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
    const {searchTerm, year = null} = queries;
    const params = {};
    params.query = searchTerm;
    if (year !== null) {
        params.year = year;
    }
    return await moviedb.searchMovie(params);
};

// DELETE
exports.deleteMovie = async (params, headers) => {

};

