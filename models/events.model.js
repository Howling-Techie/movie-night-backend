const client = require("../database/connection");
const jwt = require("jsonwebtoken");
const {checkIfExists, getServerAccessLevel, canUserAccessEvent} = require("./utils.model");

// SELECT
exports.selectEvent = async (params, headers) => {
    const {event_id} = params;
    const token = headers["authorization"];
    await checkEventIsAccessible(event_id, token);

    const results = await client.query(`SELECT *
                                        FROM events
                                        WHERE event_id = $1`, [event_id]);
    return results.rows[0];
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
        const results = await client.query(`SELECT e.*
                                            FROM events e
                                                     LEFT JOIN servers s ON e.server_id = s.server_id
                                            WHERE e.visibility = 0
                                              AND s.visibility = 0`);
        return results.rows;
    }
};

exports.selectEventEntries = async (params, headers) => {
    const {event_id} = params;
    const token = headers["authorization"];
    await checkEventIsAccessible(event_id, token);

    const results = await client.query(`SELECT *
                                        FROM event_entries
                                        WHERE event_id = $1`, [event_id]);
    return results.rows.map(entry => {
        return {...entry, score: +entry.score};
    });
};

exports.selectEventVotes = async (params, headers) => {
    const {event_id} = params;
    const token = headers["authorization"];
    await checkEventIsAccessible(event_id, token);

    // Fetch votes for the given event_id
    const votesResult = await client.query(`
        SELECT *
        FROM votes
        WHERE event_id = $1;
    `, [event_id]);
    const votes = votesResult.rows;

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
    return votes;
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
