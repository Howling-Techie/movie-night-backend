const {getEvents, getEvent, getEntries, getVotes} = require("../controllers/events.controller");
const eventsRouter = require("express").Router();

eventsRouter
    .route("/")
    .get(getEvents);

eventsRouter
    .route("/:event_id")
    .get(getEvent);

eventsRouter
    .route("/:event_id/entries")
    .get(getEntries);

eventsRouter
    .route("/:event_id/votes")
    .get(getVotes);


module.exports = eventsRouter;
