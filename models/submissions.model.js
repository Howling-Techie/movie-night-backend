const client = require("../database/connection");

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

};
exports.insertSubmissionMovie = async (params, body, headers) => {

};

// DELETE
exports.deleteSubmission = async (params, headers) => {

};
exports.deleteSubmissionMovie = async (params, headers) => {

};

