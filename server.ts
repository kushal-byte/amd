import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("plans.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    summary TEXT NOT NULL,
    overallScore REAL NOT NULL,
    items TEXT NOT NULL,
    constraints TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/plans", (req, res) => {
    const { id, name, summary, overallScore, items, constraints } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO plans (id, name, summary, overallScore, items, constraints)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, name, summary, overallScore, JSON.stringify(items), JSON.stringify(constraints));
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error saving plan:", error);
      res.status(500).json({ error: "Failed to save plan" });
    }
  });

  app.get("/api/plans", (req, res) => {
    try {
      const plans = db.prepare("SELECT id, name, summary, overallScore, createdAt FROM plans ORDER BY createdAt DESC").all();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  app.get("/api/plans/:id", (req, res) => {
    try {
      const plan = db.prepare("SELECT * FROM plans WHERE id = ?").get(req.params.id);
      if (plan) {
        // @ts-ignore
        plan.items = JSON.parse(plan.items);
        // @ts-ignore
        plan.constraints = JSON.parse(plan.constraints);
        res.json(plan);
      } else {
        res.status(404).json({ error: "Plan not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plan" });
    }
  });

  app.delete("/api/plans/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM plans WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete plan" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
