const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 


/*
    File: index.js
    Simple Express server with one API endpoint connected to PostgreSQL.
    - GET /users : returns all users from the "users" table (created automatically if missing)
    Configure DB via environment variable DATABASE_URL or edit the default connection below.
*/


const app = express();
app.use(express.json());
app.use(cors({origin: '*'})); // Enable CORS for all origins

const PORT = process.env.PORT || 3000;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/postgres',
    // For many managed PG services you may require SSL: uncomment next line if needed
    // ssl: { rejectUnauthorized: false },
});

async function initDb() {
    // ensure table exists
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL
        )
    `);

    // insert a sample user if table is empty
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    if (rows[0].count === 0) {
        await pool.query(
            'INSERT INTO users(name, email) VALUES($1, $2)',
            ['Sample User', 'sample@example.com']
        );
    }
}

app.get('/items', async (req, res) => {
    try {
        const result = await pool.query('SELECT * from items ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('DB error', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(PORT, async () => {
    try {
        await initDb();
        console.log(`Server listening on port ${PORT}`);
    } catch (err) {
        console.error('Failed to initialize DB', err);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await pool.end();
    process.exit(0);
});