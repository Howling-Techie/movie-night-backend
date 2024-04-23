const {
    getSubmissionEvents,
    getSubmission,
    getSubmissions,
    getSubmissionStatuses
} = require("../controllers/submissions.controller");
const submissionsRouter = require("express").Router();

submissionsRouter
    .route("/statuses")
    .get(getSubmissionStatuses);

submissionsRouter
    .route("/:submission_id")
    .get(getSubmission);

submissionsRouter
    .route("/:submission_id/events")
    .get(getSubmissionEvents);

submissionsRouter
    .route("/")
    .get(getSubmissions);

module.exports = submissionsRouter;
