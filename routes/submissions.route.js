const {
    getSubmissionEvents,
    getSubmission,
    getSubmissions,
    getSubmissionStatuses,
    getSubmissionUsers
} = require("../controllers/submissions.controller");
const submissionsRouter = require("express").Router();

submissionsRouter
    .route("/")
    .get(getSubmissions);

submissionsRouter
    .route("/statuses")
    .get(getSubmissionStatuses);

submissionsRouter
    .route("/users")
    .get(getSubmissionUsers);

submissionsRouter
    .route("/:submission_id")
    .get(getSubmission);

submissionsRouter
    .route("/:submission_id/events")
    .get(getSubmissionEvents);

module.exports = submissionsRouter;
