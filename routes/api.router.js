const authRouter = require("./auth.router");

const apiRouter = require("express").Router();
apiRouter.use("/auth", authRouter);

module.exports = apiRouter;
