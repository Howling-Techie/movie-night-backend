const {
    getServers,
    getServerEvents,
    getServerSubmissions,
    getServer,
    getServerTags
} = require("../controllers/servers.controller");
const serversRouter = require("express").Router();

serversRouter
    .route("/")
    .get(getServers);

serversRouter
    .route("/:server_id")
    .get(getServer);

serversRouter
    .route("/:server_id/events")
    .get(getServerEvents);

serversRouter
    .route("/:server_id/submissions")
    .get(getServerSubmissions);

serversRouter
    .route("/:server_id/tags")
    .get(getServerTags);


module.exports = serversRouter;
