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
    await client.query("DROP TABLE IF EXISTS reviews;");
    await client.query("DROP TABLE IF EXISTS event_comments;");
    await client.query("DROP TABLE IF EXISTS comments;");
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
            id           VARCHAR(255) PRIMARY KEY,
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
            id          VARCHAR(255) PRIMARY KEY,
            server_name VARCHAR(255)      NOT NULL,
            visibility  INTEGER DEFAULT 0 NOT NULL,
            avatar      VARCHAR(255),
            owner_id    VARCHAR(255) REFERENCES users (id)
        );
    `);

    // Create server_users table
    await client.query(`
        CREATE TABLE IF NOT EXISTS server_users
        (
            user_id      VARCHAR(255) REFERENCES users (id)   NOT NULL,
            server_id    VARCHAR(255) REFERENCES servers (id) NOT NULL,
            access_level INTEGER DEFAULT 1                    NOT NULL,
            PRIMARY KEY (user_id, server_id)
        );
    `);

    // Create tags table
    await client.query(`
        CREATE TABLE IF NOT EXISTS tags
        (
            id          SERIAL PRIMARY KEY,
            server_id   VARCHAR(255) REFERENCES servers (id) NOT NULL,
            name        VARCHAR(255)                         NOT NULL,
            description TEXT,
            icon        VARCHAR(255)
        );
    `);

    // Create events table
    await client.query(`
        CREATE TABLE IF NOT EXISTS events
        (
            id                  SERIAL PRIMARY KEY,
            server_id           VARCHAR(255) REFERENCES servers (id)  NOT NULL,
            created_by          VARCHAR(255) REFERENCES users (id)    NOT NULL,
            visibility          INTEGER     DEFAULT 0                 NOT NULL,
            start_time          TIMESTAMPTZ,
            voting_open_time    TIMESTAMPTZ,
            voting_closing_time TIMESTAMPTZ,
            time_created        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
            title               VARCHAR(255)                          NOT NULL,
            description         TEXT,
            tag_id              INTEGER REFERENCES tags (id),
            points_available    INTEGER     DEFAULT 0                 NOT NULL
        );
    `);

    // Create movies table
    await client.query(`
        CREATE TABLE IF NOT EXISTS movies
        (
            id             SERIAL PRIMARY KEY,
            title          VARCHAR(255)      NOT NULL,
            release_date   DATE,
            duration       INTEGER,
            description    TEXT,
            avg_rating     DECIMAL DEFAULT 0 NOT NULL,
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
            id   SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            icon VARCHAR(255)
        );
    `);

    // Create movie_genres table
    await client.query(`
        CREATE TABLE IF NOT EXISTS movie_genres
        (
            movie_id INTEGER REFERENCES movies (id) NOT NULL,
            genre_id INTEGER REFERENCES genres (id) NOT NULL,
            PRIMARY KEY (movie_id, genre_id)
        );
    `);

    // Create submissions table
    await client.query(`
        CREATE TABLE IF NOT EXISTS submissions
        (
            id               SERIAL PRIMARY KEY,
            user_id          VARCHAR(255) REFERENCES users (id)    NOT NULL,
            server_id        VARCHAR(255) REFERENCES servers (id)  NOT NULL,
            tag_id           INTEGER REFERENCES tags (id),
            time_submitted   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
            title            VARCHAR(255)                          NOT NULL,
            description      TEXT,
            rating           INTEGER     DEFAULT 0                 NOT NULL,
            status           VARCHAR(255),
            first_appearance DATE,
            last_appearance  DATE
        );
    `);

    // Create submission_movies table
    await client.query(`
        CREATE TABLE IF NOT EXISTS submission_movies
        (
            movie_id      INTEGER REFERENCES movies (id)      NOT NULL,
            submission_id INTEGER REFERENCES submissions (id) NOT NULL,
            image         VARCHAR(255),
            poster        VARCHAR(255),
            PRIMARY KEY (movie_id, submission_id)
        );
    `);

    // Create event_entries table
    await client.query(`
        CREATE TABLE IF NOT EXISTS event_entries
        (
            id            SERIAL PRIMARY KEY,
            event_id      INTEGER REFERENCES events (id)      NOT NULL,
            submission_id INTEGER REFERENCES submissions (id) NOT NULL,
            score         DECIMAL DEFAULT 0                   NOT NULL,
            status        INTEGER DEFAULT 0                   NOT NULL
        );
    `);

    // Create votes table
    await client.query(`
        CREATE TABLE IF NOT EXISTS votes
        (
            id             SERIAL PRIMARY KEY,
            user_id        VARCHAR(255) REFERENCES users (id)    NOT NULL,
            event_id       INTEGER REFERENCES events (id)        NOT NULL,
            time_submitted TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
            split_vote     BOOLEAN     DEFAULT FALSE             NOT NULL
        );
    `);

    // Create entry_votes table
    await client.query(`
        CREATE TABLE IF NOT EXISTS entry_votes
        (
            entry_id INTEGER REFERENCES event_entries (id) NOT NULL,
            vote_id  INTEGER REFERENCES votes (id)         NOT NULL,
            points   DECIMAL DEFAULT NULL,
            PRIMARY KEY (entry_id, vote_id)
        );
    `);

    // Create reviews table
    await client.query(`
        CREATE TABLE IF NOT EXISTS reviews
        (
            id             SERIAL PRIMARY KEY,
            user_id        VARCHAR(255) REFERENCES users (id)    NOT NULL,
            movie_id       INTEGER REFERENCES movies (id)        NOT NULL,
            time_submitted TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
            rating         INTEGER,
            comment        TEXT
        );
    `);

    // Create comments table
    await client.query(`
        CREATE TABLE IF NOT EXISTS comments
        (
            id             SERIAL PRIMARY KEY,
            user_id        VARCHAR(255) REFERENCES users (id)    NOT NULL,
            time_submitted TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
            comment        TEXT
        );
    `);

    // Create event_comments table
    await client.query(`
        CREATE TABLE IF NOT EXISTS event_comments
        (
            event_id   INTEGER REFERENCES events (id),
            comment_id INTEGER REFERENCES comments (id),
            PRIMARY KEY (event_id, comment_id)
        );
    `);
}

async function insertData(data) {
    // Insert data into each table
    await insertDataIntoTable("users", data.users);
    await insertDataIntoTable("servers", data.servers);
    await insertDataIntoTable("movies", data.movies);
    await insertDataIntoTable("genres", data.genres);
    await insertDataIntoTable("movie_genres", data.movieGenres);
    await insertDataIntoTable("tags", data.tags);
    await insertDataIntoTable("server_users", data.serverUsers);
    await insertDataIntoTable("submissions", data.submissions);
    await insertDataIntoTable("submission_movies", data.submissionMovies);
    await insertDataIntoTable("events", data.events);
    await insertDataIntoTable("event_entries", data.eventEntries);
    await insertDataIntoTable("votes", data.votes);
    await insertDataIntoTable("entry_votes", data.entryVotes);

    // //Update first and last appearance based on the latest event_date for each submission_id
    // await client.query(`
    //     UPDATE submissions s
    //     SET first_appearance = ee.min_event_date
    //     FROM (SELECT submission_id, MIN(e.start_time) AS min_event_date
    //           FROM event_entries
    //                    LEFT JOIN events e on e.event_id = event_entries.event_id
    //           GROUP BY submission_id) ee
    //     WHERE s.submission_id = ee.submission_id;
    //
    //     UPDATE submissions s
    //     SET last_appearance = ee.max_event_date
    //     FROM (SELECT submission_id, MAX(e.start_time) AS max_event_date
    //           FROM event_entries
    //                    LEFT JOIN events e on e.event_id = event_entries.event_id
    //           GROUP BY submission_id) ee
    //     WHERE s.submission_id = ee.submission_id;
    // `);
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
