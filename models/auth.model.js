const client = require("../database/connection");
const {generateToken} = require("./utils.model");
const jwt = require("jsonwebtoken");
const axios = require("axios");

exports.signInUser = async (body) => {
    try {
        const {code} = body;
        if (code) {
            const data = new URLSearchParams();
            data.append("grant_type", "authorization_code");
            data.append("code", code);
            data.append("redirect_uri", "http://localhost:5173/auth/discord/callback");

            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
            };

            const auth = {
                username: process.env.DISCORD_CLIENT_ID,
                password: process.env.DISCORD_CLIENT_SECRET,
            };

            try {
                const tokenResponse = await axios.post(`https://discord.com/api/oauth2/token`, data, {
                    headers,
                    auth,
                });

                const {access_token} = tokenResponse.data;

                // Fetch user information using the obtained access token
                const discordUserResponse = await axios.get("https://discord.com/api/users/@me", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                });
                const discordUserGuildsResponse = await axios.get("https://discord.com/api/users/@me/guilds", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                });
                const discordUser = discordUserResponse.data;
                const userGuilds = discordUserGuildsResponse.data;

                // Store the user info in database
                const userResponse = await client.query(`INSERT INTO users(user_id, username, display_name, avatar, banner, banner_color)
                                                         VALUES ($1, $2, $3, $4, $5, $6)
                                                         ON CONFLICT ON CONSTRAINT users_pkey
                                                             DO UPDATE SET username     = $2,
                                                                           display_name = $3,
                                                                           avatar       = $4,
                                                                           banner       = $5,
                                                                           banner_color = $5
                                                         RETURNING *;`, [discordUser.id, discordUser.username, discordUser.global_name, discordUser.avatar, discordUser.banner, discordUser.accent_color]);

                // Add server info for users
                for (const userGuild of userGuilds) {
                    // Add server if the user owns it
                    if (userGuild.owner) {
                        await client.query(`INSERT INTO servers(server_id, server_name, visibility, avatar, owner_id)
                                            VALUES ($1, $2, $3, $4, $5)
                                            ON CONFLICT ON CONSTRAINT servers_pkey
                                                DO UPDATE SET server_name = $2,
                                                              avatar      = $4;`,
                            [userGuild.id, userGuild.name, 0, userGuild.icon, discordUser.id]);

                        await client.query(`INSERT INTO server_users(user_id, server_id, access_level)
                                            VALUES ($1, $2, $3)
                                            ON CONFLICT ON CONSTRAINT server_users_pkey
                                                DO UPDATE SET access_level = $3;`,
                            [discordUser.id, userGuild.id, 2]);
                    } else {
                        // If the server exists, add the user to it
                        const serverResults = await client.query(`SELECT *
                                                                  FROM servers
                                                                  WHERE server_id = $1;`,
                            [userGuild.id]);
                        if (serverResults.rows.length > 0) {
                            await client.query(`INSERT INTO server_users(user_id, server_id, access_level)
                                                VALUES ($1, $2, $3)
                                                ON CONFLICT ON CONSTRAINT server_users_pkey
                                                    DO UPDATE SET access_level = $3;`,
                                [discordUser.id, userGuild.id, 1]);
                        }
                    }
                }

                // User data to generate auth tokens
                return generateReturnObject(userResponse.rows[0]);
            } catch (error) {
                console.error(error.response.data);
                return Promise.reject({status: 500, msg: "Internal Server Error"});
            }
        } else {
            return Promise.reject({status: 400, msg: "Token not provided"});
        }
    } catch
        (error) {
        console.error("Error during token exchange:", error);
        return Promise.reject({status: 500, msg: "Internal Server Error"});
    }
};

exports.refreshCurrentUser = async (body) => {
    const {refreshToken} = body;

    if (!refreshToken) {
        return Promise.reject({status: 400, msg: "Missing refresh token"});
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_KEY);
        const userResponse = await client.query(`SELECT *
                                                 FROM users
                                                 WHERE user_id = $1;`, [decoded.user_id]);
        return generateReturnObject(userResponse.rows[0]);
    } catch {
        return Promise.reject({status: 401, msg: "Unauthorised"});
    }
};

const generateReturnObject = (user) => {
    const response = {...user};
    response.tokens = {
        accessToken: generateToken({
            id: user.user_id,
            username: user.username,
            displayName: user.display_name
        }),
        refreshToken: generateToken({id: user.user_id}, "7d")
    };
    const tokenExpiration = Date.now() + 60 * 60 * 1000;
    const refreshExpiration = Date.now() + 7 * 24 * 60 * 60 * 1000;
    response.expiration = {auth: tokenExpiration, refresh: refreshExpiration};
    return response;
};
