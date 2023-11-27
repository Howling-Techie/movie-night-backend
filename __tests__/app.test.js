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
                        console.log(event);
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

        });
        describe("/api/events/:event_id/votes", () => {

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
