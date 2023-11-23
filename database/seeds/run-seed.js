const seed = require("./seed.js");
const db = require("../connection.js");

const runSeed = () => {
    return seed();
};

runSeed();
