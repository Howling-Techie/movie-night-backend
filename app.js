const express = require("express")
    , app = express();
const apiRouter = require("./routes/api.router");
const bodyParser = require("body-parser");

const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json());

app.use("/api", apiRouter);


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, function (err) {
    if (err) {
        return console.log(err);
    }
    console.log(`Listening at http://localhost:${PORT}/`);
});

module.exports = app;
