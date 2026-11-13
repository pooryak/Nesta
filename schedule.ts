
import { runScrape } from "./scraper";
import { generateDashboard } from "./dashboard";
import type { Match } from "./types";

async function main() {
  const matches = await runScrape();

  matches.sort((a, b) =>
    `${a.date}${a.time}${a.complex}${a.pitch}`.localeCompare(
      `${b.date}${b.time}${b.complex}${b.pitch}`
    )
  );

  console.log("\n========== FOOTBALL SCHEDULE ==========\n");

  const groups = new Map<string, Match[]>();
  for (const match of matches) {
    const key = `${match.date} | ${match.complex} | ${match.pitch}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(match);
  }

  for (const [group, games] of groups) {
    console.log(`\n📍 ${group}`);
    for (const game of games) {
      console.log(`  ${game.time} | ${game.home} vs ${game.away}`);
      console.log(`  Competition: ${game.competition}`);
    }
  }

  const fs = await import("node:fs/promises");
  await fs.writeFile("schedule.json", JSON.stringify(matches, null, 2), "utf-8");
  await generateDashboard(matches);
  console.log("\nSaved to schedule.json and dashboard.html");
}

main().catch(console.error);
