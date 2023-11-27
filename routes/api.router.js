const authRouter = require("./auth.router");
const eventsRouter = require("./events.router");

const apiRouter = require("express").Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/events", eventsRouter);
module.exports = apiRouter;
