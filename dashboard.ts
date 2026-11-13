
import type { Match } from "./types";

export function buildHtml(matches: Match[]): string {
  const data = JSON.stringify(matches).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Poststadion – Football Schedule</title>
<style>
:root { font-family: Inter, system-ui, Arial, sans-serif; color: #1e293b; background: #f1f5f9; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { padding: 24px; }
.container { max-width: 1500px; margin: auto; }

.header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
  color: #fff;
  padding: 28px 32px;
  border-radius: 16px;
  margin-bottom: 22px;
}
.header h1 { font-size: 22px; margin-bottom: 4px; }
.header p { color: #bfdbfe; font-size: 13px; margin-top: 3px; }
.header .range { margin-top: 8px; font-size: 15px; font-weight: 700; color: #fff; }

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.stat {
  background: #fff;
  padding: 18px 22px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.stat strong { display: block; font-size: 30px; font-weight: 700; }
.stat small { font-size: 13px; color: #64748b; }

.filters {
  background: #fff;
  padding: 18px 22px;
  border-radius: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 28px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .04em; color: #64748b; margin-bottom: 6px; }
select, input {
  width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0;
  border-radius: 8px; font-size: 14px; background: #fff; color: #1e293b;
}

/* Day */
.day { margin-bottom: 40px; }
.day-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.day-header h2 { font-size: 19px; font-weight: 700; }
.day-badge {
  background: #eff6ff; color: #2563eb;
  padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
}

/* Pitch grid */
.pitch-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

/* Pitch card */
.pitch-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,.07);
  border: 1px solid #e8edf3;
}
.pitch-card.is-busy { border-top: 3px solid #2563eb; }
.pitch-card.is-free { border-top: 3px solid #16a34a; background: #f0fdf4; }

.pc-name { font-size: 13px; font-weight: 700; line-height: 1.3; }
.pc-label { font-size: 11px; color: #64748b; margin-bottom: 10px; }

/* Timeline */
.tl-wrap { margin-bottom: 10px; }
.tl-hours {
  position: relative;
  height: 14px;
  margin-bottom: 2px;
}
.tl-hours span {
  position: absolute;
  font-size: 9px;
  color: #94a3b8;
  transform: translateX(-50%);
  line-height: 1;
}
.tl-bar {
  position: relative;
  height: 26px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
/* green band for free 2h windows */
.tl-free {
  position: absolute;
  top: 0; bottom: 0;
  background: rgba(22,163,74,.15);
  border-left: 2px solid #22c55e;
  border-right: 2px solid #22c55e;
}
/* blue block for busy slot */
.tl-busy {
  position: absolute;
  top: 3px; bottom: 3px;
  background: #2563eb;
  border-radius: 4px;
  cursor: default;
}
.tl-busy:hover { background: #1d4ed8; }

/* Hour tick lines */
.tl-tick {
  position: absolute;
  top: 0; bottom: 0;
  width: 1px;
  background: #e2e8f0;
  pointer-events: none;
}

/* Free slot badges */
.free-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.free-badge {
  background: #dcfce7; color: #15803d;
  border: 1px solid #86efac;
  border-radius: 5px; padding: 2px 8px;
  font-size: 10px; font-weight: 700;
}
.all-free {
  color: #16a34a; font-size: 12px; font-weight: 700; margin-bottom: 10px;
}
.no-free {
  color: #dc2626; font-size: 11px; font-weight: 700; margin-bottom: 10px;
}

/* Match list inside card */
.pm-list { border-top: 1px solid #e8edf3; padding-top: 8px; }
.pm-item { padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
.pm-item:last-child { border-bottom: none; }
.pm-time { font-size: 14px; font-weight: 700; color: #2563eb; }
.pm-teams { font-weight: 600; margin: 2px 0; line-height: 1.3; }
.pm-comp { font-size: 10px; color: #94a3b8; }
.pm-link { display: inline-block; font-size: 10px; color: #2563eb; text-decoration: none; margin-top: 2px; }
.pm-link:hover { text-decoration: underline; }

/* Other/unknown pitch */
.other-section { margin-top: 4px; }
.other-title { font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 10px; }
.other-match {
  display: grid;
  grid-template-columns: 68px 1fr auto;
  gap: 12px;
  align-items: center;
  background: #fff;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  font-size: 13px;
}
.om-time { font-size: 16px; font-weight: 700; color: #2563eb; }
.om-teams { font-weight: 600; }
.om-comp { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.other-match a { color: #2563eb; text-decoration: none; font-size: 12px; white-space: nowrap; }
.other-match a:hover { text-decoration: underline; }

.empty { text-align: center; padding: 60px; color: #94a3b8; background: #fff; border-radius: 12px; }

@media (max-width: 1200px) { .pitch-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 800px) {
  body { padding: 12px; }
  .stats, .filters { grid-template-columns: 1fr 1fr; }
  .pitch-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .stats, .filters { grid-template-columns: 1fr; }
  .pitch-grid { grid-template-columns: 1fr; }
  .other-match { grid-template-columns: 58px 1fr; }
  .other-match a { grid-column: 2; }
}
</style>
</head>
<body>
<div class="container">
  <header class="header">
    <h1>⚽ Poststadion – Football Schedule</h1>
    <p>Lehrter Str. 59, 10557 Berlin</p>
    <p class="range" id="range-label"></p>
  </header>

  <section class="stats">
    <div class="stat">
      <strong id="st-matches">0</strong>
      <small>Matches found</small>
    </div>
    <div class="stat">
      <strong id="st-free" style="color:#16a34a">0</strong>
      <small>Free 2-hour slots</small>
    </div>
    <div class="stat">
      <strong id="st-busy" style="color:#2563eb">0</strong>
      <small>Pitch-days occupied</small>
    </div>
  </section>

  <section class="filters">
    <div>
      <label for="fDate">Date</label>
      <select id="fDate"><option value="">All dates</option></select>
    </div>
    <div>
      <label for="fPitch">Pitch</label>
      <select id="fPitch"><option value="">All pitches</option></select>
    </div>
    <div>
      <label for="fSearch">Search teams</label>
      <input id="fSearch" placeholder="Team name…">
    </div>
  </section>

  <main id="results"></main>
</div>

<script>
const matches = ${data};

// ── Config ─────────────────────────────────────────────
const OP_START  = 8  * 60;   // 08:00
const OP_END    = 22 * 60;   // 22:00
const MATCH_DUR = 120;        // assumed slot per match (minutes)
const FREE_MIN  = 120;        // minimum free window to highlight

const KNOWN_PITCHES = [
  { num: 1, name: 'Mete-Ekşi-Platz',        label: 'Platz 1' },
  { num: 2, name: 'Dalia-Elyakim-Platz',    label: 'Platz 2' },
  { num: 3, name: 'Hatun-Sürücü-Platz',     label: 'Platz 3' },
  { num: 4, name: 'Jana-Lange-Platz',       label: 'Platz 4' },
  { num: 5, name: 'Hermann-Horwitz-Platz',  label: 'Platz 6' },
];

// ── Helpers ────────────────────────────────────────────
function toMins(t) {
  var m = (t || '').match(/^(\\d{1,2}):(\\d{2})/);
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : null;
}

function toHHMM(mins) {
  var h = Math.floor(mins / 60), m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function tlPct(mins) {
  return ((mins - OP_START) / (OP_END - OP_START) * 100).toFixed(2);
}

function pitchNum(pitch) {
  var m = (pitch || '').match(/(?:Platz|Pl\\.?|KR|RR|NR)\\s*(\\d+)/i);
  return m ? parseInt(m[1]) : null;
}

function knownPitch(pitch) {
  var n = pitchNum(pitch);
  return n !== null ? KNOWN_PITCHES.find(function(p) { return p.num === n; }) : null;
}

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function safeUrl(v) {
  try {
    var u = new URL(v);
    return u.protocol === 'https:' && u.hostname === 'www.fussball.de' ? esc(u.href) : '#';
  } catch(e) { return '#'; }
}

// ── Schedule logic ─────────────────────────────────────
function getBusy(dayMatches, pNum) {
  return dayMatches
    .filter(function(m) { return pitchNum(m.pitch) === pNum; })
    .map(function(m) {
      var s = toMins(m.time);
      return s !== null ? { start: s, end: s + MATCH_DUR, match: m } : null;
    })
    .filter(Boolean)
    .sort(function(a, b) { return a.start - b.start; });
}

function getFree(busy) {
  // Merge overlapping busy blocks, clamped to operating hours
  var merged = [];
  busy.forEach(function(p) {
    var cs = Math.max(p.start, OP_START), ce = Math.min(p.end, OP_END);
    if (ce <= cs) return;
    if (merged.length && merged[merged.length - 1].end >= cs) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, ce);
    } else {
      merged.push({ start: cs, end: ce });
    }
  });

  var free = [], cur = OP_START;
  merged.forEach(function(b) {
    if (b.start - cur >= FREE_MIN) free.push({ start: cur, end: b.start });
    cur = Math.max(cur, b.end);
  });
  if (OP_END - cur >= FREE_MIN) free.push({ start: cur, end: OP_END });
  return free;
}

// ── Timeline ───────────────────────────────────────────
function renderTimeline(busy, free) {
  var TOTAL = OP_END - OP_START;

  // Hour tick lines + labels
  var hours = '<div class="tl-hours">';
  for (var h = 8; h <= 22; h += 2) {
    var left = tlPct(h * 60);
    hours += '<span style="left:' + left + '%">' + h + '</span>';
  }
  hours += '</div>';

  var bar = '<div class="tl-bar">';

  // Hour tick marks inside bar
  for (var th = 10; th < 22; th += 2) {
    bar += '<div class="tl-tick" style="left:' + tlPct(th * 60) + '%"></div>';
  }

  // Green overlays for free 2h windows
  free.forEach(function(s) {
    var l = tlPct(s.start);
    var w = ((s.end - s.start) / TOTAL * 100).toFixed(2);
    bar += '<div class="tl-free" style="left:' + l + '%;width:' + w + '%" ' +
           'title="Free ' + toHHMM(s.start) + '–' + toHHMM(s.end) + '"></div>';
  });

  // Blue blocks for matches
  busy.forEach(function(p) {
    var cs = Math.max(p.start, OP_START), ce = Math.min(p.end, OP_END);
    if (ce <= cs) return;
    var l = tlPct(cs);
    var w = ((ce - cs) / TOTAL * 100).toFixed(2);
    var title = esc(p.match.time) + ' – ' + esc(p.match.home) + ' vs ' + esc(p.match.away);
    bar += '<div class="tl-busy" style="left:' + l + '%;width:' + w + '%" title="' + title + '"></div>';
  });

  bar += '</div>';
  return '<div class="tl-wrap">' + hours + bar + '</div>';
}

// ── Pitch card ─────────────────────────────────────────
function renderCard(p, dayMatches) {
  var busy = getBusy(dayMatches, p.num);
  var free = getFree(busy);
  var isFree = busy.length === 0;

  var html = '<div class="pitch-card ' + (isFree ? 'is-free' : 'is-busy') + '">';
  html += '<div class="pc-name">' + esc(p.name) + '</div>';
  html += '<div class="pc-label">' + esc(p.label) + '</div>';

  html += renderTimeline(busy, free);

  if (isFree) {
    html += '<div class="all-free">✓ Free all day (08:00–22:00)</div>';
  } else if (free.length) {
    html += '<div class="free-badges">';
    free.forEach(function(s) {
      html += '<span class="free-badge">&#128994; ' + toHHMM(s.start) + '–' + toHHMM(s.end) + '</span>';
    });
    html += '</div>';
  } else {
    html += '<div class="no-free">&#9940; No 2h free slot</div>';
  }

  if (busy.length) {
    html += '<div class="pm-list">';
    busy.forEach(function(b) {
      var m = b.match;
      html += '<div class="pm-item">';
      html += '<div class="pm-time">' + esc(m.time) + '</div>';
      html += '<div class="pm-teams">' + esc(m.home) + ' vs ' + esc(m.away) + '</div>';
      html += '<div class="pm-comp">' + esc(m.competition) + '</div>';
      if (m.url) {
        html += '<a class="pm-link" href="' + safeUrl(m.url) + '" target="_blank" rel="noopener">Details ↗</a>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ── Page setup ─────────────────────────────────────────
var $ = function(id) { return document.getElementById(id); };
var unique = function(arr) { return [...new Set(arr.filter(Boolean))].sort(); };

var dates = unique(matches.map(function(m) { return m.date; }));

function fillSelect(id, vals) {
  var sel = $(id);
  vals.forEach(function(v) {
    var o = document.createElement('option');
    o.value = v; o.textContent = v;
    sel.appendChild(o);
  });
}

fillSelect('fDate', dates);
fillSelect('fPitch', KNOWN_PITCHES.map(function(p) { return p.name + ' (' + p.label + ')'; }));

$('range-label').textContent = dates.length ? 'Weekend: ' + dates.join(' – ') : '';

// ── Render ─────────────────────────────────────────────
function render() {
  var dateVal  = $('fDate').value;
  var pitchVal = $('fPitch').value;
  var search   = $('fSearch').value.toLowerCase();

  var filtered = matches.filter(function(m) {
    var text = [m.home, m.away, m.competition].join(' ').toLowerCase();
    var kp = knownPitch(m.pitch);
    var pd = kp ? kp.name + ' (' + kp.label + ')' : '';
    return (!dateVal  || m.date === dateVal) &&
           (!pitchVal || pd === pitchVal) &&
           text.includes(search);
  });

  $('st-matches').textContent = filtered.length;

  var byDate = {};
  filtered.forEach(function(m) {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  });

  // Stats: count free slots and busy pitch-days
  var totalFree = 0, totalBusy = 0;
  var statDates = dateVal ? [dateVal] : dates;
  statDates.forEach(function(d) {
    var dm = byDate[d] || [];
    KNOWN_PITCHES.forEach(function(p) {
      var busy = getBusy(dm, p.num);
      var free = getFree(busy);
      totalFree += free.length;
      if (busy.length) totalBusy++;
    });
  });
  $('st-free').textContent = totalFree;
  $('st-busy').textContent = totalBusy;

  var result = $('results');

  if (!Object.keys(byDate).length) {
    result.innerHTML = '<div class="empty">No matches found for these filters.</div>';
    return;
  }

  var showPitches = pitchVal
    ? KNOWN_PITCHES.filter(function(p) { return (p.name + ' (' + p.label + ')') === pitchVal; })
    : KNOWN_PITCHES;

  var out = '';

  Object.entries(byDate).sort().forEach(function(entry) {
    var date = entry[0], dayMatches = entry[1];
    var dow = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    out += '<section class="day">';
    out += '<div class="day-header"><h2>' + esc(dow) + '</h2>';
    out += '<span class="day-badge">' + esc(date) + '</span></div>';

    out += '<div class="pitch-grid">';
    showPitches.forEach(function(p) {
      out += renderCard(p, dayMatches);
    });
    out += '</div>';

    // Unknown-pitch matches
    var others = dayMatches
      .filter(function(m) { return !knownPitch(m.pitch); })
      .sort(function(a, b) { return a.time.localeCompare(b.time); });

    if (others.length) {
      out += '<div class="other-section">';
      out += '<div class="other-title">&#9888;&#65039; Unknown pitch &mdash; ' + others.length +
             ' match' + (others.length !== 1 ? 'es' : '') + ' without venue info</div>';
      others.forEach(function(m) {
        out += '<div class="other-match">';
        out += '<div class="om-time">' + esc(m.time) + '</div>';
        out += '<div><div class="om-teams">' + esc(m.home) + ' vs ' + esc(m.away) + '</div>';
        out += '<div class="om-comp">' + esc(m.competition) + '</div></div>';
        if (m.url) {
          out += '<a href="' + safeUrl(m.url) + '" target="_blank" rel="noopener">Details ↗</a>';
        } else {
          out += '<span></span>';
        }
        out += '</div>';
      });
      out += '</div>';
    }

    out += '</section>';
  });

  result.innerHTML = out;
}

['fDate', 'fPitch'].forEach(function(id) {
  $(id).addEventListener('change', render);
});
$('fSearch').addEventListener('input', render);

render();
</script>
</body>
</html>`;
}

export async function generateDashboard(matches: Match[]): Promise<void> {
  const html = buildHtml(matches);
  const fs = await import("node:fs/promises");
  await fs.writeFile("dashboard.html", html, "utf-8");
  console.log("Dashboard generated: dashboard.html");
}
