const {getEvents, getEvent} = require("../controllers/events.controller");
const eventsRouter = require("express").Router();

eventsRouter
    .route("/")
    .get(getEvents);

eventsRouter
    .route("/:event_id")
    .get(getEvent);

module.exports = eventsRouter;
