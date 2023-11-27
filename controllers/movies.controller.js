const {selectMovies, selectMovie} = require("../models/movies.model");

exports.getMovies = (req, res, next) => {
    selectMovies(req.query)
        .then((movies) => {
            res.status(200).send({movies});
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
