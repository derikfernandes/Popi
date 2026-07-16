// Servidor de desenvolvimento/produção local.
// As rotas da API vivem em api/index.ts (compartilhadas com a Vercel).
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./api/index";

const PORT = 3000;

// Serve static frontend files (middleware for dev / static for prod)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, express serves compiled files in dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server fully running on http://localhost:${PORT}`);
  });
}

startServer();
