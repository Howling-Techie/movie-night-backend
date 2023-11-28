const authRouter = require("./auth.router");
const eventsRouter = require("./events.router");
const moviesRouter = require("./movies.router");
const serversRouter = require("./servers.router");
const submissionsRouter = require("./submissions.route");

const apiRouter = require("express").Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/events", eventsRouter);
apiRouter.use("/movies", moviesRouter);
apiRouter.use("/submissions", submissionsRouter);
apiRouter.use("/servers", serversRouter);
module.exports = apiRouter;
