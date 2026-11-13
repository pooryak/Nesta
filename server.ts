
import express from "express";
import { runScrape } from "./scraper";
import { buildHtml } from "./dashboard";

const app = express();
const PORT = process.env.PORT ?? "3000";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface Cache {
  html: string;
  builtAt: Date;
}

let cache: Cache | null = null;
let scraping = false;
// Resolves when the in-flight scrape finishes (used only when there is no cache yet)
let scrapePromise: Promise<void> | null = null;

function isStale(): boolean {
  return !cache || Date.now() - cache.builtAt.getTime() > CACHE_TTL_MS;
}

async function refresh(): Promise<void> {
  if (scraping) return;
  scraping = true;
  console.log("Scrape started…");
  try {
    const matches = await runScrape();
    cache = { html: withBanner(buildHtml(matches), new Date()), builtAt: new Date() };
    console.log("Scrape finished, cache updated.");
  } catch (err) {
    console.error("Scrape failed:", err);
  } finally {
    scraping = false;
    scrapePromise = null;
  }
}

function withBanner(html: string, builtAt: Date): string {
  const banner = `
<div style="position:fixed;bottom:16px;right:16px;background:#1e293b;color:#fff;
            padding:8px 14px;border-radius:8px;font-size:12px;
            font-family:system-ui,sans-serif;z-index:9999;display:flex;gap:12px;
            align-items:center;box-shadow:0 4px 12px rgba(0,0,0,.3)">
  <span>Updated ${builtAt.toLocaleString("en-GB", { timeZone: "Europe/Berlin" })}</span>
  <a href="/refresh" style="color:#60a5fa;text-decoration:none;font-weight:600">↻ Refresh</a>
</div>`;
  return html.replace("</body>", banner + "\n</body>");
}

function loadingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="5">
<title>Loading…</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f1f5f9;
         display: flex; align-items: center; justify-content: center;
         height: 100vh; margin: 0; }
  .box { background: #fff; border-radius: 16px; padding: 48px 56px;
         text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,.08); }
  h1 { font-size: 22px; margin-bottom: 12px; color: #1e293b; }
  p  { color: #64748b; margin: 0 0 24px; font-size: 15px; }
  .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0;
             border-top-color: #2563eb; border-radius: 50%;
             animation: spin .8s linear infinite; margin: 0 auto; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="box">
  <h1>⚽ Poststadion – Football Schedule</h1>
  <p>Fetching weekend matches… this takes about 30 seconds on first load.</p>
  <div class="spinner"></div>
</div>
</body>
</html>`;
}

// ── Routes ────────────────────────────────────────────────

app.get("/", (_req, res) => {
  if (!cache) {
    // First load: wait for the scrape to complete, then respond
    if (!scrapePromise) {
      scrapePromise = refresh();
    }
    // Return loading page immediately; browser auto-refreshes every 5 s
    res.send(loadingPage());
    return;
  }

  // We have cached data — serve it immediately
  if (isStale() && !scraping) {
    // Kick off background refresh; next request will still see old cache
    // until the new scrape finishes
    scrapePromise = refresh();
  }

  res.send(cache.html);
});

app.get("/refresh", async (_req, res) => {
  if (!scraping) {
    scrapePromise = refresh();
    await scrapePromise;
  }
  res.redirect("/");
});

// ── Start ─────────────────────────────────────────────────

app.listen(Number(PORT), () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  // Pre-warm cache so the first visitor doesn't see the loading page
  scrapePromise = refresh();
});
