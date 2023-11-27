const client = require("../connection");

async function seed(data) {
    try {
        // Drop tables if they exist
        await dropTables();

        // Recreate tables
        await createTables();

        // Insert data if provided
        if (data) {
            await insertData(data);
        }
    } catch (error) {
        console.error("Error seeding tables:", error);
    }
}

async function dropTables() {
    // Drop tables in reverse order to avoid foreign key constraints
    await client.query("DROP TABLE IF EXISTS entry_votes;");
    await client.query("DROP TABLE IF EXISTS votes;");
    await client.query("DROP TABLE IF EXISTS event_entries;");
    await client.query("DROP TABLE IF EXISTS submission_movies;");
    await client.query("DROP TABLE IF EXISTS submissions;");
    await client.query("DROP TABLE IF EXISTS movie_genres;");
    await client.query("DROP TABLE IF EXISTS genres;");
    await client.query("DROP TABLE IF EXISTS movies;");
    await client.query("DROP TABLE IF EXISTS events;");
    await client.query("DROP TABLE IF EXISTS tags;");
    await client.query("DROP TABLE IF EXISTS server_users;");
    await client.query("DROP TABLE IF EXISTS servers;");
    await client.query("DROP TABLE IF EXISTS users;");
}

async function createTables() {
    // Create users table
    await client.query(`
        CREATE TABLE IF NOT EXISTS users
        (
            user_id      VARCHAR(255) PRIMARY KEY,
            username     VARCHAR(255) NOT NULL,
            display_name VARCHAR(255),
            avatar       VARCHAR(255),
            banner       VARCHAR(255),
            banner_color VARCHAR(255),
            description  TEXT
        );
    `);

    // Create servers table
    await client.query(`
        CREATE TABLE IF NOT EXISTS servers
        (
            server_id   VARCHAR(255) PRIMARY KEY,
            server_name VARCHAR(255)      NOT NULL,
            visibility  INTEGER DEFAULT 0 NOT NULL,
            avatar      VARCHAR(255)
        );
    `);

    // Create server_users table
    await client.query(`
        CREATE TABLE IF NOT EXISTS server_users
        (
            user_id      VARCHAR(255) REFERENCES users (user_id)     NOT NULL,
            server_id    VARCHAR(255) REFERENCES servers (server_id) NOT NULL,
            access_level INTEGER DEFAULT 1                           NOT NULL,
            PRIMARY KEY (user_id, server_id)
        );
    `);

    // Create tags table
    await client.query(`
        CREATE TABLE IF NOT EXISTS tags
        (
            tag_id      SERIAL PRIMARY KEY,
            server_id   VARCHAR(255) REFERENCES servers (server_id) NOT NULL,
            name        VARCHAR(255)                                NOT NULL,
            description TEXT,
            icon        VARCHAR(255)
        );
    `);

    // Create events table
    await client.query(`
        CREATE TABLE IF NOT EXISTS events
        (
            event_id            SERIAL PRIMARY KEY,
            server_id           VARCHAR(255) REFERENCES servers (server_id) NOT NULL,
            created_by          VARCHAR(255) REFERENCES users (user_id)     NOT NULL,
            visibility          INTEGER     DEFAULT 0                       NOT NULL,
            start_time          TIMESTAMPTZ,
            voting_open_time    TIMESTAMPTZ,
            voting_closing_time TIMESTAMPTZ,
            time_created        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP       NOT NULL,
            title               VARCHAR(255)                                NOT NULL,
            description         TEXT,
            tag_id              INTEGER REFERENCES tags (tag_id),
            points_available    INTEGER     DEFAULT 0                       NOT NULL
        );
    `);

    // Create movies table
    await client.query(`
        CREATE TABLE IF NOT EXISTS movies
        (
            movie_id       SERIAL PRIMARY KEY,
            title          VARCHAR(255) NOT NULL,
            release_date   DATE,
            duration       INTEGER,
            description    TEXT,
            image          VARCHAR(255),
            poster         VARCHAR(255),
            imdb_id        VARCHAR(255),
            letterboxd_url VARCHAR(255)
        );
    `);

    // Create genres table
    await client.query(`
        CREATE TABLE IF NOT EXISTS genres
        (
            genre_id SERIAL PRIMARY KEY,
            name     VARCHAR(255) NOT NULL,
            icon     VARCHAR(255)
        );
    `);

    // Create movie_genres table
    await client.query(`
        CREATE TABLE IF NOT EXISTS movie_genres
        (
            movie_id INTEGER REFERENCES movies (movie_id) NOT NULL,
            genre_id INTEGER REFERENCES genres (genre_id) NOT NULL,
            PRIMARY KEY (movie_id, genre_id)
        );
    `);

    // Create submissions table
    await client.query(`
        CREATE TABLE IF NOT EXISTS submissions
        (
            submission_id    SERIAL PRIMARY KEY,
            user_id          VARCHAR(255) REFERENCES users (user_id)     NOT NULL,
            server_id        VARCHAR(255) REFERENCES servers (server_id) NOT NULL,
            tag_id           INTEGER REFERENCES tags (tag_id),
            time_submitted   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP       NOT NULL,
            title            VARCHAR(255)                                NOT NULL,
            description      TEXT,
            status           VARCHAR(255),
            first_appearance DATE,
            last_appearance  DATE
        );
    `);

    // Create submission_movies table
    await client.query(`
        CREATE TABLE IF NOT EXISTS submission_movies
        (
            movie_id      INTEGER REFERENCES movies (movie_id)           NOT NULL,
            submission_id INTEGER REFERENCES submissions (submission_id) NOT NULL,
            image         VARCHAR(255),
            poster        VARCHAR(255),
            PRIMARY KEY (movie_id, submission_id)
        );
    `);

    // Create event_entries table
    await client.query(`
        CREATE TABLE IF NOT EXISTS event_entries
        (
            entry_id      SERIAL PRIMARY KEY,
            event_id      INTEGER REFERENCES events (event_id)           NOT NULL,
            submission_id INTEGER REFERENCES submissions (submission_id) NOT NULL,
            score         INTEGER      DEFAULT 0                         NOT NULL,
            status        VARCHAR(255) DEFAULT 'pending'                 NOT NULL
        );
    `);

    // Create votes table
    await client.query(`
        CREATE TABLE IF NOT EXISTS votes
        (
            vote_id    SERIAL PRIMARY KEY,
            user_id    VARCHAR(255) REFERENCES users (user_id) NOT NULL,
            event_id   INTEGER REFERENCES events (event_id)    NOT NULL,
            split_vote BOOLEAN DEFAULT FALSE                   NOT NULL
        );
    `);

    // Create entry_votes table
    await client.query(`
        CREATE TABLE IF NOT EXISTS entry_votes
        (
            entry_id INTEGER REFERENCES event_entries (entry_id) NOT NULL,
            vote_id  INTEGER REFERENCES votes (vote_id)          NOT NULL,
            points   INTEGER DEFAULT NULL,
            PRIMARY KEY (entry_id, vote_id)
        );
    `);
}

async function insertData(data) {
    // Insert data into each table
    await insertDataIntoTable("servers", data.servers);
    await insertDataIntoTable("movies", data.movies);
    await insertDataIntoTable("genres", data.genres);
    await insertDataIntoTable("movie_genres", data.movieGenres);
    await insertDataIntoTable("users", data.users);
    await insertDataIntoTable("tags", data.tags);
    await insertDataIntoTable("server_users", data.serverUsers);
    await insertDataIntoTable("submissions", data.submissions);
    await insertDataIntoTable("submission_movies", data.submissionMovies);
    await insertDataIntoTable("events", data.events);
    await insertDataIntoTable("event_entries", data.eventEntries);
    await insertDataIntoTable("votes", data.votes);
    await insertDataIntoTable("entry_votes", data.entryVotes);
}

async function insertDataIntoTable(tableName, dataArray) {
    const columns = Object.keys(dataArray[0]).join(", ");
    const values = dataArray.map((data) => Object.values(data));

    const query = `INSERT INTO ${tableName} (${columns})
    VALUES
    ${generateValuesPlaceholder(values)}`;
    await client.query(query, values.flat());
}

function generateValuesPlaceholder(values) {
    const rowsPlaceholder = values.map((_, index) => `(${values[0].map((_, i) => `$${index * values[0].length + i + 1}`).join(", ")})`).join(", ");
    return `${rowsPlaceholder}`;
}

module.exports = seed;
