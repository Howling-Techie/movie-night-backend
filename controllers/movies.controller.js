const {
    selectMovies,
    selectMovie,
    searchMovies,
    selectMovieSubmissions,
    selectMovieImagesById
} = require("../models/movies.model");

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
    selectMovieSubmissions(req.params, req.headers)
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

exports.getMovieImagesById = (req, res, next) => {
    selectMovieImagesById(req.params)
        .then((images) => {
            res.status(200).send({images});
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
