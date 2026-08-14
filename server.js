import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve the built Vite application
app.use(express.static(path.join(__dirname, "dist")));

// Health check
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    app: "SATprep.io"
  });
});

// Send the app for any route that wasn't matched above
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`SATprep.io listening on port ${port}`);
});
