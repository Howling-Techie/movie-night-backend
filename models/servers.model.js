const client = require("../database/connection");
const {checkIfExists, canUserAccessServer} = require("./utils.model");
const jwt = require("jsonwebtoken");

// SELECT
exports.selectServer = async (params, headers) => {
    const {server_id} = params;
    const token = headers["authorization"];
    await checkServerIsAccessible(server_id, token);

    const results = await client.query(`SELECT *
                                        FROM servers
                                        WHERE server_id = $1`, [server_id]);
    return results.rows[0];
};
exports.selectServerUsers = async (params, queries, headers) => {
    const {server_id} = params;
    const token = headers["authorization"];
    await checkServerIsAccessible(server_id, token);

    const results = await client.query(`SELECT *
                                        FROM users
                                                 INNER JOIN server_users su on users.user_id = su.user_id
                                        WHERE su.server_id = $1`, [server_id]);
    return results.rows;
};
exports.selectServerEvents = async (params, queries, headers) => {
    const {server_id} = params;
    const token = headers["authorization"];
    await checkServerIsAccessible(server_id, token);
    const results = await client.query(`SELECT *
                                        FROM events
                                        WHERE server_id = $1`, [server_id]);
    return results.rows;
};
exports.selectServerSubmissions = async (params, queries, headers) => {
    const {server_id} = params;
    const token = headers["authorization"];
    await checkServerIsAccessible(server_id, token);

    const results = await client.query(`SELECT *
                                        FROM submissions
                                        WHERE server_id = $1`, [server_id]);
    return results.rows;
};
exports.selectServers = async (queries, headers) => {
    const token = headers["authorization"];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            const user_id = decoded.user_id;
            const results = await client.query(`SELECT s.*
                                                FROM servers s
                                                         LEFT JOIN server_users su ON su.server_id = s.server_id AND su.user_id = $1
                                                WHERE (
                                                              (s.visibility = 0)
                                                              OR
                                                              (su.user_id = $1 AND s.visibility <= su.access_level)
                                                          );`, [user_id]);
            return results.rows;
        } catch {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    } else {
        const results = await client.query(`SELECT s.*
                                            FROM servers s
                                            WHERE s.visibility = 0;`);
        return results.rows;
    }
};
exports.selectServerTags = async (params, headers) => {
    const {server_id} = params;
    const token = headers["authorization"];
    await checkServerIsAccessible(server_id, token);

    const results = await client.query(`SELECT *
                                        FROM tags
                                        WHERE server_id = $1`, [server_id]);
    return results.rows;
};

// UPDATE
exports.updateServerUser = async (params, body, headers) => {

};

// INSERT
exports.insertServer = async (body, headers) => {

};
exports.insertServerUser = async (params, body, headers) => {

};

// DELETE
exports.deleteServer = async (params, headers) => {

};
exports.insertServerUser = async (params, headers) => {

};

const checkServerIsAccessible = async (server_id, token) => {
    if (!server_id) {
        return Promise.reject({status: 400, msg: "Server ID not provided"});
    }
    if (Number.isNaN(server_id)) {
        return Promise.reject({status: 400, msg: "Invalid server_id datatype"});
    }
    if (!(await checkIfExists("servers", "server_id", server_id.toString()))) {
        return Promise.reject({status: 404, msg: "Server not found"});
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            const user_id = decoded.user_id;
            const access = await canUserAccessServer(server_id, user_id);
            if (!access) {
                return Promise.reject({status: 401, msg: "Unauthorised"});
            }
        } catch {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    } else {
        const serverResults = await client.query(`SELECT *
                                                  FROM servers
                                                  WHERE server_id = $1`, [server_id]);
        const server = serverResults.rows[0];
        if (server.visibility !== 0) {
            return Promise.reject({status: 401, msg: "Unauthorised"});
        }
    }
};
