const client = require("../database/connection");
const {checkIfExists, canUserAccessServer} = require("./utils.model");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// SELECT
exports.selectSubmission = async (params, headers) => {
    const {submission_id} = params;
    if (!submission_id) {
        return Promise.reject({status: 400, msg: "Submission ID not provided"});
    }
    if (Number.isNaN(+submission_id)) {
        return Promise.reject({status: 400, msg: "Invalid submission id datatype"});
    }
    const results = await client.query(`SELECT *
                                        FROM submissions
                                        WHERE id = $1`, [submission_id]);

    if (results.rows.length === 0) {
        return Promise.reject({status: 404, msg: "Submission not found"});
    }
    const submission = results.rows[0];
    const userResult = await client.query(`SELECT *
                                           FROM users u
                                           WHERE u.id = $1`, [submission.user_id]);
    submission.user = userResult.rows[0];
    const serverResult = await client.query(`SELECT *
                                             FROM servers s
                                             WHERE s.id = $1`, [submission.server_id]);
    submission.server = serverResult.rows[0];
    const movieResults = await client.query(`SELECT sm.movie_id, sm.image, sm.poster
                                             FROM submission_movies sm
                                             WHERE sm.submission_id = $1`, [submission.id]);
    submission.movies = movieResults.rows;
    for (const movie of submission.movies) {
        const movieResult = await client.query(`SELECT m.*
                                                FROM movies m
                                                WHERE m.id = $1`, [movie.movie_id]);
        const genreResult = await client.query(`SELECT g.name
                                                FROM movie_genres mg
                                                         LEFT JOIN genres g on g.id = mg.genre_id
                                                WHERE mg.movie_id = $1`, [movie.movie_id]);
        movie.movie_info = movieResult.rows[0];
        movie.movie_info.genres = genreResult.rows;
    }
    return submission;
};
exports.selectSubmissionStatuses = async () => {
    const results = await client.query(`SELECT DISTINCT status
                                        FROM submissions`);

    if (results.rows.length === 0) {
        return Promise.reject({status: 404, msg: "Statuses not found"});
    }
    return results.rows;
};

exports.selectSubmissionEvents = async (params, headers) => {
    const {submission_id} = params;
    if (!submission_id) {
        return Promise.reject({status: 400, msg: "Submission ID not provided"});
    }
    if (Number.isNaN(+submission_id)) {
        return Promise.reject({status: 400, msg: "Invalid submission_id datatype"});
    }
    const results = await client.query(`SELECT *
                                        FROM submissions
                                        WHERE id = $1`, [submission_id]);

    if (results.rows.length === 0) {
        return Promise.reject({status: 404, msg: "Submission not found"});
    }

    const eventResults = await client.query(`SELECT e.*
                                             FROM events e
                                                      INNER JOIN event_entries ee on e.id = ee.event_id
                                             WHERE ee.submission_id = $1`, [submission_id]);

    const events = eventResults.rows;
    for (const event of events) {
        const serverResult = await client.query(`SELECT s.*
                                                 FROM servers s
                                                 WHERE s.id = $1`, [event.server_id]);
        event.server = serverResult.rows[0];
    }
    return events;
};

exports.selectSubmissions = async (queries, headers) => {
    const {sort_by = "time_submitted", order = "desc", statuses, users, limit = 20, p = 1} = queries;
    if (!(order === "asc" || order === "desc")) {
        return Promise.reject({status: 400, msg: "Invalid order"});
    }
    const validSorts = ["title", "time_submitted", "id"];
    if (!validSorts.includes(sort_by)) {
        return Promise.reject({status: 400, msg: "Invalid sort_by"});
    }
    const results = await client.query(`SELECT *
                                        FROM submissions
                                        ORDER BY ${sort_by} ${order}
                                        LIMIT ${limit} OFFSET ${limit * (p - 1)}`);
    const submissions = results.rows;

    for (const submission of submissions) {
        const movieSubmissionResults = await client.query(`SELECT *
                                                           FROM submission_movies
                                                           WHERE submission_id = $1`, [submission.id]);
        const submissionMovies = movieSubmissionResults.rows;

        for (const submissionMovie of submissionMovies) {
            const movieResult = await client.query(`SELECT *
                                                    FROM movies
                                                    WHERE id = $1`, [submissionMovie.movie_id]);
            submissionMovie.movie_info = movieResult.rows[0];
        }

        submission.movies = submissionMovies;

        const userResult = await client.query(`SELECT *
                                               FROM users
                                               WHERE id = $1`, [submission.user_id]);
        submission.user = userResult.rows[0];
    }
    return submissions;
};

// UPDATE
exports.updateSubmission = async (params, body, headers) => {

};

// INSERT
exports.insertSubmission = async (body, headers) => {
    const tokenHeader = headers["authorization"];
    const token = tokenHeader ? tokenHeader.split(" ")[1] : null;
    const {server_id, title, description, rating, tag_id, movies} = body;
    const user_id = await checkServerIsAccessible(server_id, token);

    for (const movie of movies) {
        const options = {
            method: "GET",
            url: `https://api.themoviedb.org/3/movie/${movie.id}?language=en-US`,
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${process.env.TMDB_AUTH}`
            }
        };
        const result = await axios.request(options);
        const movieData = {
            id: result.data.id,
            imdb_id: result.data.imdb_id,
            title: result.data.title,
            description: result.data.overview,
            release_date: result.data.release_date,
            poster: result.data.poster_path,
            image: result.data.backdrop_path,
            genres: result.data.genres,
            duration: result.data.duration
        };
        await client.query(`INSERT INTO movies (id, title, release_date, duration,
                                                description, image, poster, imdb_id)
                            VALUES ($1, $2, $3, $4, $5, $6, $7,
                                    $8)
                            ON CONFLICT (id) DO UPDATE
                                SET release_date = $3,
                                    duration     = $4,
                                    description  = $5,
                                    image        = $6,
                                    poster       = $7`,
            [movieData.id, movieData.title, movieData.release_date, movieData.duration, movieData.description, movieData.image, movieData.poster, movieData.imdb_id]);
    }
    const submissionResult = await client.query(`INSERT INTO submissions (user_id, server_id, tag_id, title, description, rating, status)
                                                 VALUES ($1, $2, $3, $4, $5, $6,
                                                         'Queued')
                                                 RETURNING *`, [user_id, server_id, tag_id, title, description, rating]);
    const submission = submissionResult.rows[0];
    for (const movie of movies) {
        await client.query(`INSERT INTO submission_movies (movie_id, submission_id, image, poster)
                            VALUES ($1, $2, $3, $4)`, [movie.id, submission.id, movie.image, movie.poster]);
    }
    return submission;
};

exports.insertSubmissionMovie = async (params, body, headers) => {

};

// DELETE
exports.deleteSubmission = async (params, headers) => {

};
exports.deleteSubmissionMovie = async (params, headers) => {

};


const checkServerIsAccessible = async (server_id, token) => {
    if (!server_id) {
        return Promise.reject({status: 400, msg: "Server ID not provided"});
    }
    if (Number.isNaN(server_id)) {
        return Promise.reject({status: 400, msg: "Invalid server_id datatype"});
    }
    if (!(await checkIfExists("servers", "id", server_id.toString()))) {
        return Promise.reject({status: 404, msg: "Server not found"});
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            const username = decoded.username;
            const userResult = await client.query(`SELECT *
                                                   FROM users
                                                   WHERE username = $1`, [username]);
            const user_id = userResult.rows[0].id;
            const access = await canUserAccessServer(server_id, user_id);
            if (!access) {
                return Promise.reject({status: 401, msg: "Unauthorised"});
            }
            return user_id;
        } catch {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    } else {
        const serverResults = await client.query(`SELECT *
                                                  FROM servers
                                                  WHERE id = $1`, [server_id]);
        const server = serverResults.rows[0];
        if (server.visibility !== 0) {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    }
};
