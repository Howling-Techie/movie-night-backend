const client = require("../database/connection");
const {sign, verify, decode} = require("jsonwebtoken");

exports.checkIfExists = async (tableName, columnName, value) => {
    return (await client.query("SELECT $1 FROM $2 WHERE $1 like $3", [columnName, tableName, value])).rows.length > 0;

};

exports.getServerAccessLevel = async (server_id, user_id) => {
    // Query the server_users table for permissions
    const result = await client.query(
        "SELECT permissions FROM server_users WHERE user_id = $1 AND server_id = $2",
        [user_id, server_id]
    );

    // If a user is found, return the permissions value, otherwise return 0
    return result.rows.length > 0 ? result.rows[0].permissions : 0;
};

exports.generateToken = (payload, duration = "1hr") => {
    return sign(payload, process.env.JWT_KEY, {expiresIn: duration});
};
exports.verifyToken = (token) => {
    try {
        return verify(token, process.env.JWT_KEY);
    } catch (err) {
        return null;
    }
};
exports.refreshToken = (token) => {
    const decodedToken = decode(token);
    const currentTime = Date.now() / 1000;

    if (decodedToken && decodedToken.exp - currentTime < 300) { // If token expires in less than 5 minutes
        return sign({...decodedToken, iat: currentTime}, process.env.JWT_KEY, {expiresIn: "1h"});
    }

    return token;
};
