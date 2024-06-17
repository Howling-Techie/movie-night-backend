const client = require("../database/connection");
const jwt = require("jsonwebtoken");
const {checkIfExists, getServerAccessLevel, canUserAccessEvent} = require("./utils.model");

// SELECT
exports.selectEvent = async (params, headers) => {
    const {event_id} = params;
    const tokenHeader = headers["authorization"];
    const token = tokenHeader ? tokenHeader.split(" ")[1] : null;
    await checkEventIsAccessible(event_id, token);

    const eventResult = await client.query(`SELECT *
                                            FROM events
                                            WHERE id = $1`, [event_id]);
    const event = eventResult.rows[0];
    const serverResult = await client.query(`SELECT *
                                             FROM servers
                                             WHERE id = $1`, [event.server_id]);
    event.server = serverResult.rows[0];
    return event;
};

exports.selectEvents = async (queries, headers) => {
    const tokenHeader = headers["authorization"];
    const token = tokenHeader ? tokenHeader.split(" ")[1] : null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            const user_id = decoded.id;
            const eventResults = await client.query(`SELECT e.*
                                                     FROM events e
                                                              LEFT JOIN servers s ON e.server_id = s.id
                                                              LEFT JOIN server_users su ON su.server_id = s.id AND su.user_id = $1
                                                     WHERE (
                                                               (e.visibility = 0 AND s.visibility = 0)
                                                                   OR
                                                               (su.user_id = $1 AND e.visibility <= su.access_level)
                                                               );`, [user_id]);
            const events = eventResults.rows;
            for (const event of events) {
                const serverResult = await client.query(`SELECT *
                                                         FROM servers
                                                         WHERE id = $1`, [event.server_id]);
                event.server = serverResult.rows[0];
            }
            return events;
        } catch {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    } else {
        const eventResults = await client.query(`SELECT e.*
                                                 FROM events e
                                                          LEFT JOIN servers s ON e.server_id = s.id
                                                 WHERE e.visibility = 0
                                                   AND s.visibility = 0`);
        const events = eventResults.rows;
        for (const event of events) {
            const serverResult = await client.query(`SELECT *
                                                     FROM servers
                                                     WHERE id = $1`, [event.server_id]);
            event.server = serverResult.rows[0];
        }
        return events;
    }
};

exports.selectEventEntries = async (params, headers) => {
    const {event_id} = params;
    const tokenHeader = headers["authorization"];
    const token = tokenHeader ? tokenHeader.split(" ")[1] : null;
    await checkEventIsAccessible(event_id, token);

    const entryResults = await client.query(`SELECT *
                                             FROM event_entries
                                             WHERE event_id = $1`, [event_id]);
    const entries = entryResults.rows.map(entry => {
        return {...entry, score: +entry.score};
    });

    const submissionIds = entries.reduce((ids, entry) => ids.concat(entry.submission_id), []);
    const submissionResults = await client.query(`
        SELECT *
        FROM submissions
        WHERE id = ANY ($1)
    `, [submissionIds]);
    const submissions = submissionResults.rows;

    const userIds = submissions.reduce((ids, submission) => ids.concat(submission.user_id), []);
    const userResults = await client.query(`
        SELECT *
        FROM users
        WHERE id = ANY ($1)
    `, [userIds]);
    const users = userResults.rows;

    const submissionMovieResults = await client.query(`
        SELECT sm.submission_id, sm.movie_id, sm.image, sm.poster
        FROM submission_movies sm
        WHERE sm.submission_id = ANY ($1)
    `, [submissionIds]);
    const submissionMovies = submissionMovieResults.rows;

    const movieIds = submissionMovies.reduce((ids, submissionMovie) => ids.concat(submissionMovie.movie_id), []);
    const movieResults = await client.query(`
        SELECT m.*
        FROM movies m
        WHERE m.id = ANY ($1)
    `, [movieIds]);
    const movies = movieResults.rows;

    const genreResults = await client.query(`
        SELECT mg.movie_id, g.name
        FROM genres g
                 INNER JOIN movie_genres mg on g.id = mg.genre_id
        WHERE mg.movie_id = ANY ($1)
    `, [movieIds]);
    const genres = genreResults.rows;

    for (const entry of entries) {
        const submission = submissions.find(s => s.id === entry.submission_id);
        submission.user = users.find(u => u.id === submission.user_id);
        submission.movies = submissionMovies.filter(sm => sm.submission_id === submission.id);
        for (const movie of submission.movies) {
            movie.movie_info = movies.find(m => m.id === movie.movie_id);
            movie.movie_info.genres = genres.filter(g => g.movie_id === movie.movie_id).map(g => g.name);
        }
        entry.submission = submission;
    }
    return entries;
};

exports.selectEventVotes = async (params, headers) => {
    const {event_id} = params;
    const tokenHeader = headers["authorization"];
    const token = tokenHeader ? tokenHeader.split(" ")[1] : null;
    await checkEventIsAccessible(event_id, token);

    // Get points available for event
    const eventResult = await client.query(`
        SELECT *
        FROM events
        WHERE id = $1;
    `, [event_id]);
    const maxPoints = eventResult.rows[0].points_available;

    // Fetch votes for the given event_id
    const voteResults = await client.query(`
        SELECT *
        FROM votes
        WHERE event_id = $1;
    `, [event_id]);
    const votes = voteResults.rows;

    // Get all vote ids
    const voteIds = votes.map(vote => vote.id);

    // Fetch all entry_votes for these vote ids at once
    const voteValuesResult = await client.query(`
        SELECT *
        FROM entry_votes
        WHERE vote_id = ANY ($1);
    `, [voteIds]);

    // Map vote_values to corresponding votes
    const voteValues = voteValuesResult.rows;
    for (const vote of votes) {
        vote.votes = voteValues.filter(entryVote => entryVote.vote_id === vote.id).map(entryVote => {
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
    // Fetch all unique user_ids from votes
    const userIds = [...new Set(votes.map(vote => vote.user_id))];

    // Then fetch all these users at once
    const usersResult = await client.query(`SELECT *
                                            FROM users
                                            WHERE id = ANY ($1)`, [userIds]);
    const users = usersResult.rows;

    // Same for submissions
    const submissionIds = [...new Set(entries.map(entry => entry.submission_id))];

    // Then fetch all these users at once
    const submissionsResult = await client.query(`SELECT *
                                                  FROM submissions
                                                  WHERE id = ANY ($1)`, [submissionIds]);
    const submissions = submissionsResult.rows;

    for (const entry of entries) {
        entry.submission = submissions.find(submission => submission.id === entry.submission_id);
        //Match up votes to entries
        entry.votes = [];
        entry.score = 0;
        for (const vote of votes) {
            if (vote.votes.some(voteVote => voteVote.entry_id === entry.id)) {
                const user = users.find(user => user.id === vote.user_id);
                entry.votes.push({
                    user,
                    points: vote.votes.find(voteVote => voteVote.entry_id === entry.id).points
                });
                entry.score += vote.votes.find(voteVote => voteVote.entry_id === entry.id).points;
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
    if (!(await checkIfExists("events", "id", +event_id))) {
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
                                                 WHERE id = $1`, [event_id]);
        const event = eventResults.rows[0];
        if (event.visibility !== 0) {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    }
};
