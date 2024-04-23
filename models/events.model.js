const client = require("../database/connection");
const jwt = require("jsonwebtoken");
const {checkIfExists, getServerAccessLevel, canUserAccessEvent} = require("./utils.model");

// SELECT
exports.selectEvent = async (params, headers) => {
    const {event_id} = params;
    const token = headers["authorization"];
    await checkEventIsAccessible(event_id, token);

    const eventResult = await client.query(`SELECT *
                                            FROM events
                                            WHERE event_id = $1`, [event_id]);
    const event = eventResult.rows[0];
    const serverResult = await client.query(`SELECT *
                                             FROM servers
                                             WHERE server_id = $1`, [event.server_id]);
    event.server = serverResult.rows[0];
    return event;
};

exports.selectEvents = async (queries, headers) => {
    const token = headers["authorization"];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            const user_id = decoded.user_id;
            const results = await client.query(`SELECT e.*
                                                FROM events e
                                                         LEFT JOIN servers s ON e.server_id = s.server_id
                                                         LEFT JOIN server_users su ON su.server_id = s.server_id AND su.user_id = $1
                                                WHERE (
                                                              (e.visibility = 0 AND s.visibility = 0)
                                                              OR
                                                              (su.user_id = $1 AND e.visibility <= su.access_level)
                                                          );`, [user_id]);
            return results.rows;
        } catch {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    } else {
        const eventResults = await client.query(`SELECT e.*
                                                 FROM events e
                                                          LEFT JOIN servers s ON e.server_id = s.server_id
                                                 WHERE e.visibility = 0
                                                   AND s.visibility = 0`);
        const events = eventResults.rows;
        for (const event of events) {
            const serverResult = await client.query(`SELECT *
                                                     FROM servers
                                                     WHERE server_id = $1`, [event.server_id]);
            event.server = serverResult.rows[0];
        }
        return events;
    }
};

exports.selectEventEntries = async (params, headers) => {
    const {event_id} = params;
    const token = headers["authorization"];
    await checkEventIsAccessible(event_id, token);

    const entryResults = await client.query(`SELECT *
                                             FROM event_entries
                                             WHERE event_id = $1`, [event_id]);
    const entries = entryResults.rows.map(entry => {
        return {...entry, score: +entry.score};
    });
    for (const entry of entries) {
        const submissionResult = await client.query(`SELECT *
                                                     FROM submissions
                                                     WHERE submission_id = $1`, [entry.submission_id]);
        const submission = submissionResult.rows[0];
        const userResult = await client.query(`SELECT *
                                               FROM users u
                                               WHERE u.user_id = $1`, [submission.user_id]);
        submission.user = userResult.rows[0];
        const serverResult = await client.query(`SELECT *
                                                 FROM servers s
                                                 WHERE s.server_id = $1`, [submission.server_id]);
        submission.server = serverResult.rows[0];
        const movieResults = await client.query(`SELECT sm.movie_id, sm.image, sm.poster
                                                 FROM submission_movies sm
                                                 WHERE sm.submission_id = $1`, [submission.submission_id]);
        submission.movies = movieResults.rows;
        for (const movie of submission.movies) {
            const movieResult = await client.query(`SELECT m.*
                                                    FROM movies m
                                                    WHERE m.movie_id = $1`, [movie.movie_id]);
            const genreResult = await client.query(`SELECT g.name
                                                    FROM movie_genres mg
                                                             LEFT JOIN genres g on g.genre_id = mg.genre_id
                                                    WHERE mg.movie_id = $1`, [movie.movie_id]);
            movie.movie_info = movieResult.rows[0];
            movie.movie_info.genres = genreResult.rows;
        }
        entry.submission = submission;
    }
    return entries;
};

exports.selectEventVotes = async (params, headers) => {
    const {event_id} = params;
    const token = headers["authorization"];
    await checkEventIsAccessible(event_id, token);

    // Fetch votes for the given event_id
    const voteResults = await client.query(`
        SELECT *
        FROM votes
        WHERE event_id = $1;
    `, [event_id]);
    const votes = voteResults.rows;

    // Fetch vote_values for each vote_id
    for (const vote of votes) {

        const voteValuesResult = await client.query(`
            SELECT *
            FROM entry_votes
            WHERE vote_id = $1;
        `, [vote.vote_id]);
        vote.votes = voteValuesResult.rows.map(entryVote => {
            return {...entryVote, points: +entryVote.points};
        });
    }

    // Get all entries in event
    const entryResults = await client.query(`SELECT *
                                             FROM event_entries
                                             WHERE event_id = $1
                                             ORDER BY score`, [event_id]);
    const entries = entryResults.rows.map(entry => {
        return {...entry, score: +entry.score};
    });
    for (const entry of entries) {
        const submissionResult = await client.query(`SELECT *
                                                     FROM submissions
                                                     WHERE submission_id = $1`, [entry.submission_id]);
        entry.submission = submissionResult.rows[0];
        //Match up votes to entries
        entry.votes = [];
        entry.score = 0;
        for (const vote of votes) {
            if (vote.votes.some(voteVote => voteVote.entry_id === entry.entry_id)) {
                const userResult = await client.query(`SELECT *
                                                       FROM users
                                                       WHERE user_id = $1`, [vote.user_id]);
                const user = userResult.rows[0];
                entry.votes.push({
                    user,
                    points: vote.votes.find(voteVote => voteVote.entry_id === entry.entry_id).points
                });
                entry.score += vote.votes.find(voteVote => voteVote.entry_id === entry.entry_id).points;
            }
        }
    }
    return entries.sort((a, b) => a.score - b.score);
};

// UPDATE
exports.updateEvent = async (params, body, headers) => {

};

// INSERT
exports.insertEvent = async (body, headers) => {

};

// DELETE
exports.deleteEvent = async (params, headers) => {

};

const checkEventIsAccessible = async (event_id, token) => {
    if (!event_id) {
        return Promise.reject({status: 400, msg: "Event ID not provided"});
    }
    if (Number.isNaN(event_id)) {
        return Promise.reject({status: 400, msg: "Invalid event_id datatype"});
    }
    if (!(await checkIfExists("events", "event_id", +event_id))) {
        return Promise.reject({status: 404, msg: "Event not found"});
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            const user_id = decoded.user_id;
            const access = await canUserAccessEvent(event_id, user_id);
            if (!access) {
                return Promise.reject({status: 401, msg: "Unauthorised"});
            }
        } catch {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    } else {
        const eventResults = await client.query(`SELECT *
                                                 FROM events
                                                 WHERE event_id = $1`, [event_id]);
        const event = eventResults.rows[0];
        if (event.visibility !== 0) {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    }
};
