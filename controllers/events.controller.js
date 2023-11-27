const {selectEvents, selectEvent, selectEventEntries, selectEventVotes} = require("../models/events.model");

exports.getEvents = (req, res, next) => {
    selectEvents(req.query, req.headers)
        .then((events) => {
            res.status(200).send({events});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getEvent = (req, res, next) => {
    selectEvent(req.params, req.headers)
        .then((event) => {
            res.status(200).send({event});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getEntries = (req, res, next) => {
    selectEventEntries(req.params, req.headers)
        .then((entries) => {
            res.status(200).send({entries});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getVotes = (req, res, next) => {
    selectEventVotes(req.params, req.headers)
        .then((votes) => {
            res.status(200).send({votes});
        })
        .catch((error) => {
            next(error);
        });
};
