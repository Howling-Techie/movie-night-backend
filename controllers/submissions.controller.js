const {
    selectSubmissions,
    selectSubmission,
    selectSubmissionEvents,
    selectSubmissionStatuses
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

exports.getSubmissionStatuses = (req, res, next) => {
    console.log("Getting statuses")
    selectSubmissionStatuses()
        .then((statuses) => {
            res.status(200).send({statuses});
        })
        .catch((error) => {
            next(error);
        });
};
