const client = require("../database/connection");
const jwt = require("jsonwebtoken");
const {checkIfExists, getServerAccessLevel} = require("./utils.model");

// SELECT
exports.selectEvent = async (params, headers) => {
    const {event_id} = params;
    if (!event_id) {
        return Promise.reject({status: 400, msg: "Event ID not provided"});
    }
    if (Number.isNaN(+event_id)) {
        return Promise.reject({status: 400, msg: "Invalid event_id datatype"});
    }
    if (!(await checkIfExists("events", "event_id", event_id))) {
        return Promise.reject({status: 404, msg: "Event not found"});
    }
    const token = headers["authorization"];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            const user_id = decoded.user_id;
            const results = await client.query(`SELECT *
                                                FROM events
                                                WHERE event_id = $1`, [event_id]);
            const event = results.rows[0];
            const accessLevel = await getServerAccessLevel(event.server_id, user_id);
            if (event.visibility === 0 || (event.visibility > 0 && accessLevel > 0)) {
                return event;
            } else {
                return Promise.reject({status: 401, msg: "Unauthorised"});
            }
        } catch {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    } else {
        const results = await client.query(`SELECT *
                                            FROM events
                                            WHERE event_id = $1`, [event_id]);
        const event = results.rows[0];
        if (event.visibility === 0) {
            return event;
        } else {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    }
};
exports.selectEvents = async (queries, headers) => {

};
exports.selectEventEntries = async (params, headers) => {

};
exports.selectEventVotes = async (params, headers) => {

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

