const app = require("../app.js");
const request = require("supertest");
const client = require("../database/connection");
const testData = require("../database/data/test-data/index");
const seed = require("../database/seeds/seed");
const {generateToken} = require("../models/utils.model");

afterAll(() => {
    return client.end();
});
beforeEach(() => seed(testData));

describe("/api/events", () => {
    describe("GET", () => {
        describe("/api/events", () => {
            test("return 200 status code", () => {
                return request(app).get("/api/events")
                    .expect(200);
            });
            test("return 401 when passed an invalid token", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                }, "0s");
                return request(app).get("/api/events")
                    .set("Authorization", accessToken)
                    .expect(401);
            });
            test("return an array of events", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/events")
                    .send({token: accessToken}).then(({body}) => {
                        body.events.forEach((event) => {
                            expect(typeof event.event_id).toBe("number");
                            expect(typeof event.server_id).toBe("string");
                            expect(typeof event.created_by).toBe("string");
                            expect(typeof event.visibility).toBe("number");
                            expect(typeof event.start_time).toBe("string");
                            expect(typeof event.voting_open_time).toBe("string");
                            expect(typeof event.voting_closing_time).toBe("string");
                            expect(typeof event.time_created).toBe("string");
                            expect(typeof event.title).toBe("string");
                            expect(typeof event.description).toBe("string");
                            expect(typeof event.tag_id).toBe("number");
                            expect(typeof event.points_available).toBe("number");
                        });
                    });
            });
            test("only return public events when no token is passed", () => {
                return request(app).get("/api/events")
                    .then(({body}) => {
                        body.events.forEach((event) => {
                            expect(event.visibility).toBe(0);
                        });
                    });
            });
            test("do not return events a user should not have access to", () => {
                const accessToken = generateToken({
                    user_id: "2",
                    username: "user2",
                    display_name: "User Two",
                });
                return request(app).get("/api/events")
                    .send({token: accessToken})
                    .then(({body}) => {
                        body.events.forEach((event) => {
                            expect(event.visibility).not.toBe(2);
                        });
                    });
            });
        });

        describe("/api/events/:event_id", () => {
            test("Return 401 when passed an invalid token", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                }, "0s");
                return request(app).get("/api/events/1")
                    .set("Authorization", accessToken)
                    .expect(401);
            });
            test("return 200 status code", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/events/1")
                    .set("Authorization", accessToken)
                    .expect(200);
            });
            test("return a public event regardless of token", () => {
                return request(app).get("/api/events/2")
                    .then(({body}) => {
                        const event = body.event;
                        expect(typeof event.event_id).toBe("number");
                        expect(typeof event.server_id).toBe("string");
                        expect(typeof event.created_by).toBe("string");
                        expect(typeof event.visibility).toBe("number");
                        expect(typeof event.start_time).toBe("string");
                        expect(typeof event.voting_open_time).toBe("string");
                        expect(typeof event.voting_closing_time).toBe("string");
                        expect(typeof event.time_created).toBe("string");
                        expect(typeof event.title).toBe("string");
                        expect(typeof event.description).toBe("string");
                        expect(typeof event.tag_id).toBe("number");
                        expect(typeof event.points_available).toBe("number");
                    });
            });
            test("return a private event when correct tokens are provided", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/events/1")
                    .set("Authorization", accessToken)
                    .then(({body}) => {
                        const event = body.event;
                        expect(event).toMatchObject({
                            event_id: 1,
                            server_id: "1",
                            created_by: "1",
                            visibility: 2,
                            start_time: "2023-01-01T12:00:00.000Z",
                            voting_open_time: "2023-01-02T12:00:00.000Z",
                            voting_closing_time: "2023-01-03T12:00:00.000Z",
                            title: "Movie Night",
                            description: "Vote for your favorite movies!",
                            tag_id: null,
                            points_available: 10
                        });
                    });
            });
            test("return 404 when trying to access an invalid event", () => {
                return request(app).get("/api/events/10")
                    .expect(404);
            });
            test("return 401 when trying to access a private event", () => {
                const accessToken = generateToken({
                    user_id: "2",
                    username: "user2",
                    display_name: "User Two",
                });
                return request(app).get("/api/events/1")
                    .send({token: accessToken})
                    .expect(401);
            });
        });

        describe("/api/events/:event_id/entries", () => {
            test("Return 401 when passed an invalid token", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                }, "0s");
                return request(app).get("/api/events/1/entries")
                    .set("Authorization", accessToken)
                    .expect(401);
            });
            test("return 200 status code", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/events/1/entries")
                    .set("Authorization", accessToken)
                    .expect(200);
            });
            test("return entries for a public event when no token is passed", () => {
                return request(app).get("/api/events/2/entries")
                    .then(({body}) => {
                        body.entries.forEach((entry) => {
                            expect(typeof entry.event_id).toBe("number");
                            expect(typeof entry.entry_id).toBe("number");
                            expect(typeof entry.submission_id).toBe("number");
                            expect(typeof entry.status).toBe("string");
                            expect(typeof entry.score).toBe("number");
                        });
                    });
            });
            test("return a private event's entries when correct tokens are provided", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/events/1/entries")
                    .set("Authorization", accessToken)
                    .then(({body}) => {
                        body.entries.forEach((entry) => {
                            expect(typeof entry.event_id).toBe("number");
                            expect(typeof entry.entry_id).toBe("number");
                            expect(typeof entry.submission_id).toBe("number");
                            expect(typeof entry.status).toBe("string");
                            expect(typeof entry.score).toBe("number");
                        });
                    });
            });
            test("return 404 when trying to access an invalid event's entries", () => {
                return request(app).get("/api/events/10/entries")
                    .expect(404);
            });
            test("return 401 when trying to access a private event's entries", () => {
                const accessToken = generateToken({
                    user_id: "2",
                    username: "user2",
                    display_name: "User Two",
                });
                return request(app).get("/api/events/1/entries")
                    .send({token: accessToken})
                    .expect(401);
            });
        });

        describe("/api/events/:event_id/votes", () => {
            test("Return 401 when passed an invalid token", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                }, "0s");
                return request(app).get("/api/events/1/votes")
                    .set("Authorization", accessToken)
                    .expect(401);
            });
            test("return 200 status code", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/events/1/votes")
                    .set("Authorization", accessToken)
                    .expect(200);
            });
            test("return votes for a public event when no token is passed", () => {
                return request(app).get("/api/events/2/votes")
                    .then(({body}) => {
                        body.votes.forEach((vote) => {
                            expect(vote).toMatchObject({
                                vote_id: expect.any(Number),
                                event_id: expect.any(Number),
                                user_id: expect.any(String),
                                split_vote: expect.any(Boolean),
                                votes: expect.any(Array),
                                time_submitted: expect.any(String)
                            });
                            expect(vote.votes[0]).toMatchObject({
                                entry_id: expect.any(Number),
                                vote_id: expect.any(Number),
                                points: expect.any(Number),
                            });
                        });
                    });
            });
            test("return a private event's votes when correct tokens are provided", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/events/1/votes")
                    .set("Authorization", accessToken)
                    .then(({body}) => {
                        body.votes.forEach((vote) => {
                            expect(vote).toMatchObject({
                                vote_id: expect.any(Number),
                                event_id: expect.any(Number),
                                user_id: expect.any(String),
                                split_vote: expect.any(Boolean),
                                votes: expect.any(Array),
                                time_submitted: expect.any(String)
                            });
                            expect(vote.votes[0]).toMatchObject({
                                entry_id: expect.any(Number),
                                vote_id: expect.any(Number),
                                points: expect.any(Number),
                            });
                        });
                    });
            });
            test("return 404 when trying to access an invalid event's votes", () => {
                return request(app).get("/api/events/10/votes")
                    .expect(404);
            });
            test("return 401 when trying to access a private event's votes", () => {
                const accessToken = generateToken({
                    user_id: "2",
                    username: "user2",
                    display_name: "User Two",
                });
                return request(app).get("/api/events/1/votes")
                    .send({token: accessToken})
                    .expect(401);
            });
        });
    });
    describe("PATCH", () => {
        describe("/api/events", () => {

        });
    });
    describe("POST", () => {
        describe("/api/events", () => {

        });
        describe("/api/events/:event_id/entries", () => {

        });
    });
    describe("PUT", () => {
        describe("/api/events/:event_id/votes", () => {

        });
    });
    describe("DELETE", () => {
        describe("/api/events", () => {

        });
        describe("/api/events/:event_id/entries", () => {

        });
    });
});

describe("/api/movies", () => {
    describe("GET", () => {
        describe("/api/movies", () => {
            test("return 200 status code", () => {
                return request(app).get("/api/movies")
                    .expect(200);
            });
            test("return an array of movies", () => {
                return request(app).get("/api/movies")
                    .then(({body}) => {
                        body.movies.forEach((movie) => {
                            expect(movie).toMatchObject({
                                movie_id: expect.any(Number),
                                title: expect.any(String),
                                release_date: expect.any(String),
                                duration: expect.any(Number),
                                description: expect.any(String),
                                image: expect.any(String),
                                poster: expect.any(String),
                                imdb_id: expect.any(String),
                                letterboxd_url: expect.any(String),
                            });
                        });
                    });
            });
        });

        describe("/api/movies/:movie_id", () => {
            test("return 200 status code", () => {
                return request(app).get("/api/movies/1")
                    .expect(200);
            });
            test("return a specific movie", () => {
                return request(app).get("/api/movies/2")
                    .then(({body}) => {
                        const movie = body.movie;
                        expect(movie).toMatchObject({
                            movie_id: 2,
                            title: "The Shawshank Redemption",
                            release_date: "1994-09-22T23:00:00.000Z",
                            duration: 142,
                            description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
                            image: "shawshank_image.jpg",
                            poster: "shawshank_poster.jpg",
                            imdb_id: "tt0111161",
                            letterboxd_url: "https://letterboxd.com/film/the-shawshank-redemption/"
                        });
                    });
            });
            test("return 404 when trying to access an invalid movie", () => {
                return request(app).get("/api/movies/10")
                    .expect(404);
            });
        });
    });
});

describe("/api/servers", () => {
    describe("GET", () => {
        describe("/api/servers", () => {
            test("return 200 status code", () => {
                return request(app).get("/api/servers")
                    .expect(200);
            });
            test("return 401 when passed an invalid token", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                }, "0s");
                return request(app).get("/api/servers")
                    .set("Authorization", accessToken)
                    .expect(401);
            });
            test("return an array of servers", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/servers")
                    .send({token: accessToken})
                    .then(({body}) => {
                        body.servers.forEach((server) => {
                            expect(typeof server.server_id).toBe("string");
                            expect(typeof server.server_name).toBe("string");
                            expect(typeof server.visibility).toBe("number");
                            expect(typeof server.avatar).toBe("string");
                        });
                    });
            });
            test("only return public servers when no token is passed", () => {
                return request(app).get("/api/servers")
                    .then(({body}) => {
                        body.servers.forEach((server) => {
                            expect(server.visibility).toBe(0);
                        });
                    });
            });
            test("do not return servers a user should not have access to", () => {
                const accessToken = generateToken({
                    user_id: "2",
                    username: "user2",
                    display_name: "User Two",
                });
                return request(app).get("/api/servers")
                    .send({token: accessToken})
                    .then(({body}) => {
                        body.servers.forEach((event) => {
                            expect(event.visibility).not.toBe(2);
                        });
                    });
            });
        });

        describe("/api/servers/:server_id", () => {
            test("Return 401 when passed an invalid token", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                }, "0s");
                return request(app).get("/api/servers/1")
                    .set("Authorization", accessToken)
                    .expect(401);
            });
            test("return 200 status code", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/servers/1")
                    .set("Authorization", accessToken)
                    .expect(200);
            });
            test("return a public server regardless of token", () => {
                return request(app).get("/api/servers/2")
                    .then(({body}) => {
                        const server = body.server;
                        expect(typeof server.server_id).toBe("string");
                        expect(typeof server.server_name).toBe("string");
                        expect(typeof server.visibility).toBe("number");
                        expect(typeof server.avatar).toBe("string");
                    });
            });
            test("return a private server when correct tokens are provided", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/servers/1")
                    .set("Authorization", accessToken)
                    .then(({body}) => {
                        const server = body.server;
                        expect(server).toMatchObject({
                            server_id: "1",
                            server_name: "Movie Lovers",
                            visibility: 1,
                            avatar: "movie_lovers_avatar.jpg"
                        });
                    });
            });
            test("return 404 when trying to access an invalid server", () => {
                return request(app).get("/api/servers/10")
                    .expect(404);
            });
            test("return 401 when trying to access a private server", () => {
                const accessToken = generateToken({
                    user_id: "2",
                    username: "user2",
                    display_name: "User Two",
                });
                return request(app).get("/api/servers/1")
                    .send({token: accessToken})
                    .expect(401);
            });
        });

        describe("/api/servers/:server_id/events", () => {
            test("Return 401 when passed an invalid token", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                }, "0s");
                return request(app).get("/api/servers/1/events")
                    .set("Authorization", accessToken)
                    .expect(401);
            });
            test("return 200 status code", () => {
                const accessToken = generateToken({
                    user_id: "1",
                    username: "user1",
                    display_name: "User One"
                });
                return request(app).get("/api/servers/1/events")
                    .set("Authorization", accessToken)
                    .expect(200);
            });
        });
    });
    describe("PATCH", () => {
        describe("/api/servers", () => {

        });
    });
    describe("POST", () => {
        describe("/api/servers", () => {

        });
        describe("/api/servers/:event_id/entries", () => {

        });
    });
    describe("PUT", () => {
        describe("/api/events/:event_id/votes", () => {

        });
    });
    describe("DELETE", () => {
        describe("/api/events", () => {

        });
        describe("/api/events/:event_id/entries", () => {

        });
    });
});

describe("/api/submissions", () => {
    describe("GET", () => {
        describe("/api/submissions", () => {
            test("return 200 status code", () => {
                return request(app).get("/api/submissions")
                    .expect(200);
            });
            test("return an array of submissions", () => {
                return request(app).get("/api/submissions")
                    .then(({body}) => {
                        body.submissions.forEach((submission) => {
                            expect(submission).toMatchObject({
                                submission_id: expect.any(Number),
                                user_id: expect.any(String),
                                server_id: expect.any(String),
                                title: expect.any(String),
                                time_submitted: expect.any(String),
                                rating: expect.any(Number),
                                description: expect.any(String),
                                first_appearance: expect.any(String),
                                last_appearance: expect.any(String),
                                movies: expect.any(Array),
                                user: expect.any(Object)
                            });
                        });
                    });
            });
        });

        describe("/api/movies/:movie_id", () => {
            test("return 200 status code", () => {
                return request(app).get("/api/movies/1")
                    .expect(200);
            });
            test("return a specific movie", () => {
                return request(app).get("/api/movies/2")
                    .then(({body}) => {
                        const movie = body.movie;
                        expect(movie).toMatchObject({
                            movie_id: 2,
                            title: "The Shawshank Redemption",
                            release_date: "1994-09-22T23:00:00.000Z",
                            duration: 142,
                            description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
                            image: "shawshank_image.jpg",
                            poster: "shawshank_poster.jpg",
                            imdb_id: "tt0111161",
                            letterboxd_url: "https://letterboxd.com/film/the-shawshank-redemption/"
                        });
                    });
            });
            test("return 404 when trying to access an invalid movie", () => {
                return request(app).get("/api/movies/10")
                    .expect(404);
            });
        });
    });
});
