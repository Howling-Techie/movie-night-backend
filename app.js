const express = require("express")
    , app = express();
const axios = require("axios");
const bodyParser = require("body-parser");

const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json());

app.post("/api/discord", async (req, res) => {
    try {
        const {code} = req.body;
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
                const response = await axios.post(`https://discord.com/api/oauth2/token`, data, {
                    headers,
                    auth,
                });

                const {access_token} = response.data;

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
                discordUser.guilds = discordUserGuildsResponse.data;
                console.log("Discord User Information:", discordUser);

                // TODO: Store in database

                res.status(200).json({user: discordUser});
            } catch (error) {
                console.error(error.response.data);
                // Handle the error here
            }
        }
    } catch
        (error) {
        console.error("Error during token exchange:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, function (err) {
    if (err) {
        return console.log(err);
    }
    console.log(`Listening at http://localhost:${PORT}/`);
});
