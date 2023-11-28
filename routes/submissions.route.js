const {getSubmissionEvents, getSubmission, getSubmissions} = require("../controllers/submissions.controller");
const submissionsRouter = require("express").Router();

submissionsRouter
    .route("/")
    .get(getSubmissions);

submissionsRouter
    .route("/:submission_id")
    .get(getSubmission);

submissionsRouter
    .route("/:submission_id/events")
    .get(getSubmissionEvents);

module.exports = submissionsRouter;
