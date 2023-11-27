const {selectEvents, selectEvent} = require("../models/events.model");

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
            console.log(error);
            next(error);
        });
};
