const {
    selectServers,
    selectServer,
    selectServerUsers,
    selectServerEvents,
    selectServerSubmissions
} = require("../models/servers.model");

exports.getServers = (req, res, next) => {
    selectServers(req.query, req.headers)
        .then((servers) => {
            res.status(200).send({servers});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getServer = (req, res, next) => {
    selectServer(req.params, req.headers)
        .then((server) => {
            res.status(200).send({server});
        })
        .catch((error) => {
            console.log(error);
            next(error);
        });
};

exports.getServerUsers = (req, res, next) => {
    selectServerUsers(req.params, req.headers)
        .then((users) => {
            res.status(200).send({users});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getServerEvents = (req, res, next) => {
    selectServerEvents(req.params, req.query, req.headers)
        .then((events) => {
            res.status(200).send({events});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getServerSubmissions = (req, res, next) => {
    selectServerSubmissions(req.params, req.headers)
        .then((submissions) => {
            res.status(200).send({submissions});
        })
        .catch((error) => {
            next(error);
        });
};
