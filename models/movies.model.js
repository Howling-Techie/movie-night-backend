const client = require("../database/connection");

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

exports.selectMovies = async (queries) => {
    const results = await client.query(`SELECT *
                                        FROM movies`);
    return results.rows;
};

exports.searchForMovies = async (queries, headers) => {

};

// DELETE
exports.deleteMovie = async (params, headers) => {

};

