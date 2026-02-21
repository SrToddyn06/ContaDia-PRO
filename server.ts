import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const db = new Database('contadia.db');

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    value REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Default settings
const defaultSettings = [
  ['half_day_value', '60'],
  ['full_day_value', '120'],
  ['show_jokes', 'true'],
  ['show_tips', 'true'],
  ['theme', 'vibrant'],
  ['weekly_goal', '2000'],
  ['monthly_goal', '8000'],
  ['last_reset_date', new Date(0).toISOString()]
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
defaultSettings.forEach(([key, val]) => insertSetting.run(key, val));

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.get('/api/logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM logs ORDER BY date DESC').all();
    res.json(logs);
  });

  app.post('/api/logs', (req, res) => {
    const { date, type, value } = req.body;
    const info = db.prepare('INSERT INTO logs (date, type, value) VALUES (?, ?, ?)').run(date, type, value);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/logs/:id', (req, res) => {
    db.prepare('DELETE FROM logs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/reset', (req, res) => {
    const now = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_reset_date', now);
    res.json({ success: true });
  });

  app.post('/api/factory-reset', (req, res) => {
    db.prepare('DELETE FROM logs').run();
    db.prepare('DELETE FROM settings').run();
    // Re-insert defaults
    const defaultSettings = [
      ['half_day_value', '60'],
      ['full_day_value', '120'],
      ['show_jokes', 'true'],
      ['show_tips', 'true'],
      ['theme', 'dark'],
      ['weekly_goal', '2000'],
      ['monthly_goal', '8000'],
      ['last_reset_date', new Date(0).toISOString()]
    ];
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    defaultSettings.forEach(([key, val]) => insertSetting.run(key, val));
    res.json({ success: true });
  });

  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post('/api/settings', (req, res) => {
    const updates = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.entries(updates).forEach(([key, val]) => {
      stmt.run(key, String(val));
    });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
