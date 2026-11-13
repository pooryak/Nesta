
import { chromium, Page } from "playwright";
import { fetchCalendarMatches } from "./calendar";
import type { Match } from "./types";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function getNextWeekendDates() {
  const now = new Date();
  const berlinDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const [year, month, day] = berlinDate.split("-").map(Number);
  const today = new Date(Date.UTC(year, month - 1, day));
  const daysUntilSaturday = (6 - today.getUTCDay() + 7) % 7;

  const saturday = new Date(today);
  saturday.setUTCDate(
    today.getUTCDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday)
  );

  const sunday = new Date(saturday);
  sunday.setUTCDate(saturday.getUTCDate() + 1);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(saturday), to: fmt(sunday) };
}

async function getText(page: Page): Promise<string> {
  return page.locator("body").innerText();
}

function getField(lines: string[], labels: string[]): string {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    for (const label of labels) {
      const match = line.match(new RegExp(`^${label}\\s*:?\\s*(.*)$`, "i"));
      if (match) {
        if (match[1].trim()) return match[1].trim();
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          if (lines[j].trim()) return lines[j].trim();
        }
      }
    }
  }
  return "Unknown";
}

function extractPitch(venue: string): string {
  const patterns = [
    /(?:Platz|Pl\.?)\s*\d+[a-z]?/i,
    /(?:KR|RR|NR)\s*\d+/i,
    /(?:Kunstrasenplatz|Rasenplatz|Hartplatz|Nebenplatz)/i,
    /(?:Kunststoffrasenplatz)/i,
  ];
  for (const p of patterns) {
    const m = venue.match(p);
    if (m) return m[0];
  }
  return "Check manually";
}

function extractComplex(venue: string): string {
  return venue
    .replace(/[,;]\s*(?:Platz|Pl\.?|KR|RR|NR)\s*\d+.*$/i, "")
    .replace(/[,;]\s*(?:Kunstrasenplatz|Rasenplatz|Hartplatz).*$/i, "")
    .trim();
}

async function getMatchDetails(
  page: Page,
  url: string
): Promise<Match | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(1500);

    let venue = "Unknown";

    const factfile = page.locator("div.factfile-data");
    if (await factfile.count() > 0) {
      const factfileText = await factfile.first().innerText();
      const lines = factfileText.split("\n").map(x => x.trim()).filter(Boolean);
      const found = getField(lines, ["Spielstätte", "Sportstätte", "Spielort", "Stadion"]);
      if (found !== "Unknown") venue = found;
    }

    if (venue === "Unknown") {
      const locationAnchor = page.locator("a.location");
      if (await locationAnchor.count() > 0) {
        venue = (await locationAnchor.first().innerText()).trim();
      }
    }

    if (venue === "Unknown") {
      const text = await getText(page);
      const lines = text.split("\n").map(x => x.trim()).filter(Boolean);
      venue = getField(lines, ["Spielstätte", "Sportstätte", "Spielort"]);
    }

    const text = await getText(page);
    const lines = text.split("\n").map(x => x.trim()).filter(Boolean);

    return {
      date:        getField(lines, ["Datum"]),
      time:        getField(lines, ["Anstoß", "Uhrzeit"]),
      home:        getField(lines, ["Heim", "Heimteam"]),
      away:        getField(lines, ["Gast", "Gastteam"]),
      competition: getField(lines, ["Wettbewerb"]),
      complex:     extractComplex(venue),
      pitch:       extractPitch(venue),
      url,
    };
  } catch (error) {
    console.error(`Could not read match: ${url}`, error);
    return null;
  }
}

export async function runScrape(): Promise<Match[]> {
  const { from, to } = getNextWeekendDates();

  console.log("Fetching upcoming weekend matches...");
  const calendarMatches = await fetchCalendarMatches(from, to);
  console.log(`Found ${calendarMatches.length} matches`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ locale: "de-DE" });

  try {
    const matches: Match[] = [];

    for (const item of calendarMatches) {
      if (!item.url || !item.hasMatchPage) {
        matches.push({
          date:        item.date,
          time:        item.time,
          home:        item.home,
          away:        item.away,
          competition: item.competition,
          complex:     "Unknown",
          pitch:       "Unknown",
          url:         item.url ?? "",
        });
        continue;
      }

      const details = await getMatchDetails(page, item.url);
      if (details) {
        matches.push({
          ...details,
          date:        item.date,
          time:        item.time,
          home:        item.home,
          away:        item.away,
          competition: item.competition,
          url:         item.url,
        });
      }

      await sleep(500);
    }

    return matches;
  } finally {
    await browser.close();
  }
}
