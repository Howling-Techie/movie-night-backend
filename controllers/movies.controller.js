const {selectMovies, selectMovie, searchMovies, selectMovieSubmissions} = require("../models/movies.model");

exports.getMovies = (req, res, next) => {
    selectMovies(req.query)
        .then((movies) => {
            res.status(200).send({movies});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getMovieSubmissions = (req, res, next) => {
    selectMovieSubmissions(req.params)
        .then((submissions) => {
            res.status(200).send({submissions});
        })
        .catch((error) => {
            next(error);
        });
};

exports.getMovie = (req, res, next) => {
    selectMovie(req.params)
        .then((movie) => {
            res.status(200).send({movie});
        })
        .catch((error) => {
            next(error);
        });
};

exports.searchMovies = (req, res, next) => {
    searchMovies(req.query, req.header)
        .then((movies) => {
            res.status(200).send({movies});
        })
        .catch((error) => {
            next(error);
        });
};
