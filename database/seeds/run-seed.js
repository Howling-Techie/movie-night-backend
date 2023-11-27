const seed = require("./seed.js");
const devData = require("../data/dev-data/index.js");
const runSeed = () => {
    return seed(devData);
};

runSeed();
