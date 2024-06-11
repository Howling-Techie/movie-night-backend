const {getMovies, getMovie, searchMovies, getMovieSubmissions} = require("../controllers/movies.controller");

const moviesRouter = require("express").Router();

moviesRouter
    .route("/")
    .get(getMovies);

moviesRouter
    .route("/search")
    .get(searchMovies);

moviesRouter
    .route("/:movie_id")
    .get(getMovie);

moviesRouter
    .route("/:movie_id/submissions")
    .get(getMovieSubmissions);

module.exports = moviesRouter;
