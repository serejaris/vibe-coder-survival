import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from 'dist' (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Database Connection
// Railway provides process.env.DATABASE_URL automatically when you hook up the Postgres plugin
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // If true, requires SSL (standard for Railway and Heroku)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize DB Table
async function initDB() {
    try {
        // We only need a simple table: id, nickname, score, and timestamp
        await pool.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        nickname VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initDB();

// API ROUTES

// GET Top 10 Scores
app.get('/api/scores', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT nickname, score, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 10'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST New Score
app.post('/api/scores', async (req, res) => {
    const { nickname, score } = req.body;

    if (!nickname || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    try {
        await pool.query(
            'INSERT INTO scores (nickname, score) VALUES ($1, $2)',
            [nickname, score]
        );
        res.status(201).json({ message: 'Score saved successfully' });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Catch-all route to serve index.html for any other requests (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
