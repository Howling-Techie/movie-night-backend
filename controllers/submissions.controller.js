const {
    selectSubmissions,
    selectSubmission,
    selectSubmissionEvents,
    selectSubmissionUsers,
    selectSubmissionStatuses, insertSubmission
} = require("../models/submissions.model");

exports.getSubmissions = (req, res, next) => {
    selectSubmissions(req.query)
        .then((submissions) => {
            res.status(200).send({submissions});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getSubmissionUsers = (req, res, next) => {
    selectSubmissionUsers()
        .then((users) => {
            res.status(200).send({users});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getSubmissionStatuses = (req, res, next) => {
    selectSubmissionStatuses()
        .then((statuses) => {
            res.status(200).send({statuses});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getSubmissionEvents = (req, res, next) => {
    selectSubmissionEvents(req.params)
        .then((events) => {
            res.status(200).send({events});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getSubmission = (req, res, next) => {
    selectSubmission(req.params)
        .then((submission) => {
            res.status(200).send({submission});
        })
        .catch((error) => {
            next(error);
        });
};


exports.postSubmission = (req, res, next) => {
    insertSubmission(req.body, req.headers)
        .then((submission) => {
            res.status(200).send({submission});
        })
        .catch((error) => {
            next(error);
        });
};
