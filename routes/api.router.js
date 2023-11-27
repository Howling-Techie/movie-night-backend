const authRouter = require("./auth.router");
const eventsRouter = require("./events.router");
const moviesRouter = require("./movies.router");

const apiRouter = require("express").Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/events", eventsRouter);
apiRouter.use("/movies", moviesRouter);
module.exports = apiRouter;
