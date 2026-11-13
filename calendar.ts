
import * as cheerio from "cheerio";

export interface CalendarMatch {
  date: string;
  time: string;
  home: string;
  away: string;
  ageGroup: string;
  competition: string;
  url?: string;
  hasMatchPage: boolean;
}

interface CalendarResponse {
  success: boolean;
  html: string;
  lastIndex: number;
  final: boolean;
  verification: {
    "datum-von": string;
    "datum-bis": string;
    plz: string;
  };
}

export async function fetchCalendarMatches(
  from: string,
  to: string
): Promise<CalendarMatch[]> {

  const postcode = "10557";

  const url =
    `https://www.fussball.de/ajax.match.calendar.loadmore/-/` +
    `datum-bis/${to}/datum-von/${from}/mime-type/JSON/` +
    `plz/${postcode}/max/100`;

  console.log("Fetching calendar:", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json, text/plain, */*",
      "Referer": "https://www.fussball.de/"
    }
  });

  if (!response.ok) {
    throw new Error(`Fussball.de returned HTTP ${response.status}`);
  }

  const result = await response.json() as CalendarResponse;

  if (!result.success || !result.html) {
    throw new Error("Invalid Fussball.de calendar response");
  }

  if (
    result.verification["datum-von"] !== from ||
    result.verification["datum-bis"] !== to ||
    result.verification.plz !== postcode
  ) {
    throw new Error("Calendar response does not match requested dates/postcode");
  }

  if (!result.final) {
    console.warn(
      "WARNING: Response is not marked final. More results may exist."
    );
  }

  const $ = cheerio.load(`<table>${result.html}</table>`);

  const matches: CalendarMatch[] = [];

  let currentDate = "";

  $("tr").each((_, element) => {
    const row = $(element);

    const rowText = row.text().replace(/\s+/g, " ").trim();
    // Detect date headers
    const dateMatch = rowText.match(
      /(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag),?\s*(\d{2})\.(\d{2})\.(\d{4})/i
    );

    if (dateMatch) {
      currentDate =
        `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      return;
    }

    // Find "Zum Spiel" (individual match page) or fall back to "Zur Gruppe"
    const matchLink = row.find("a").filter((_, anchor) => {
      return $(anchor).text().replace(/\s+/g, " ").trim() === "Zum Spiel";
    }).first();

    const groupLink = row.find("a").filter((_, anchor) => {
      return $(anchor).text().replace(/\s+/g, " ").trim() === "Zur Gruppe";
    }).first();

    const infoLink = matchLink.length ? matchLink : groupLink;
    const hasMatchPage = matchLink.length > 0;

    const href = infoLink.attr("href");

    // Team links contain a div with the team name
    const teams = row.find("a").filter((_, anchor) => {
      const link = $(anchor);

      return (
        link.find("div").length > 0 &&
        link.text().trim().length > 0
      );
    }).map((_, anchor) => {
      return $(anchor).text().replace(/\s+/g, " ").trim();
    }).get();

    if (teams.length < 2) return;

    const cells = row.find("td");

    const firstCell = cells.eq(0).text().trim();
    const timeMatch = firstCell.match(/\b\d{1,2}:\d{2}\b/);

    let matchUrl: string | undefined;
    if (href) {
      const resolved = new URL(href, "https://www.fussball.de").href;
      if (resolved.startsWith("https://www.fussball.de/")) {
        matchUrl = resolved;
      }
    }

    matches.push({
      date: currentDate,
      time: timeMatch?.[0] ?? "Unknown",
      home: teams[0],
      away: teams[1],
      ageGroup: cells.eq(1).text().trim(),
      competition: cells.eq(2).text().trim(),
      url: matchUrl,
      hasMatchPage,
    });
  });

  console.log(`Found ${matches.length} matches`);

  return matches;
}
