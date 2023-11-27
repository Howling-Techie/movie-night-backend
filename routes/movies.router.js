const {getMovies, getMovie} = require("../controllers/movies.controller");

const moviesRouter = require("express").Router();

moviesRouter
    .route("/")
    .get(getMovies);

moviesRouter
    .route("/:movie_id")
    .get(getMovie);


module.exports = moviesRouter;
