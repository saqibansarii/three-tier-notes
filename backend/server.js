require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, init, isReady } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// FRONTEND_URL can hold several addresses separated by commas
const allowedOrigins = (process.env.FRONTEND_URL || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins.includes('*') ? '*' : allowedOrigins }));
app.use(express.json());

// Health checks answer even while the database is still starting.
app.get('/', (req, res) => res.json({ status: 'ok', service: 'notes-api' }));
app.get('/health', (req, res) => res.json({ status: 'ok', database: isReady() }));

// Everything under /api needs the database.
app.use('/api', (req, res, next) =>
  isReady() ? next() : res.status(503).json({ error: 'Database is not ready yet' })
);

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

app.get('/api/notes', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
  res.json(rows);
}));

app.post('/api/notes', wrap(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const { rows } = await pool.query(
    'INSERT INTO notes (title, body) VALUES ($1, $2) RETURNING *',
    [title, body]
  );
  res.status(201).json(rows[0]);
}));

app.patch('/api/notes/:id/toggle', wrap(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE notes SET done = NOT done WHERE id = $1 RETURNING *',
    [Number(req.params.id)]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Note not found' });
  res.json(rows[0]);
}));

app.delete('/api/notes/:id', wrap(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM notes WHERE id = $1', [Number(req.params.id)]);
  if (!rowCount) return res.status(404).json({ error: 'Note not found' });
  res.status(204).end();
}));

app.listen(PORT, '0.0.0.0', () => console.log(`API listening on port ${PORT}`));
init();
