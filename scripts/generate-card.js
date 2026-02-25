const fs = require("fs");

const [repo, displayName, outputPath] = process.argv.slice(2);
const username = "Timmsy1998";

if (!repo || !displayName || !outputPath) {
  console.error(
    'Usage: node scripts/generate-card.js <repo> "<display title>" <outputPath>'
  );
  process.exit(1);
}

const TOKYO = {
  bg: "#1a1b26",
  panel: "#24283b",
  border: "#414868",
  text: "#c0caf5",
  muted: "#a9b1d6",
  accent: "#7aa2f7",
  shadow: "rgba(0,0,0,0.35)",
};

const LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  PHP: "#4F5D95",
  "C#": "#178600",
  "C++": "#f34b7d",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  "Next.js": "#000000",
  Nuxt: "#00DC82",
  "Nuxt.js": "#00DC82",
  Laravel: "#FF2D20",
  Blade: "#f7523f",
};

function escapeXml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

// naive line clamp for SVG: truncate to N chars
function clamp(str, max = 62) {
  const s = String(str || "");
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

async function ghJson(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "readme-cards",
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status} for ${url}\n${txt}`);
  }

  return res.json();
}

async function run() {
  const data = await ghJson(`https://api.github.com/repos/${username}/${repo}`);

  const stars = data.stargazers_count ?? 0;
  const forks = data.forks_count ?? 0;
  const desc = clamp(data.description || "No description set.");
  const lang = data.language || "Unknown";
  const langColor = LANG_COLORS[lang] || TOKYO.accent;

  const W = 520;
  const H = 140;
  const PAD = 18;

  const title = escapeXml(clamp(displayName, 38));
  const description = escapeXml(desc);
  const langText = escapeXml(lang);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${W} ${H}"
  width="100%"
  height="auto"
  role="img"
  aria-label="${escapeXml(displayName)}"
  preserveAspectRatio="xMidYMid meet"
>
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="${TOKYO.shadow}"/>
    </filter>
    <linearGradient id="strokeGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TOKYO.border}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${TOKYO.accent}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>

  <!-- Card -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16"
        fill="${TOKYO.bg}" stroke="url(#strokeGlow)" />

  <!-- Inner panel -->
  <rect x="${PAD}" y="${PAD}" width="${W - PAD * 2}" height="${H - PAD * 2}" rx="12"
        fill="${TOKYO.panel}" filter="url(#shadow)" stroke="${TOKYO.border}" stroke-opacity="0.35"/>

  <!-- Title -->
  <text x="${PAD + 16}" y="${PAD + 34}"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="20"
        font-weight="700"
        fill="${TOKYO.text}">
    ${title}
  </text>

  <!-- Description -->
  <text x="${PAD + 16}" y="${PAD + 62}"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="14"
        fill="${TOKYO.muted}">
    ${description}
  </text>

  <!-- Language badge -->
  <g transform="translate(${PAD + 16}, ${PAD + 82})">
    <rect x="0" y="0" width="170" height="28" rx="14" fill="${TOKYO.bg}" stroke="${TOKYO.border}" stroke-opacity="0.45"/>
    <circle cx="14" cy="14" r="6" fill="${langColor}" />
    <text x="28" y="19"
          font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
          font-size="13"
          fill="${TOKYO.text}">
      ${langText}
    </text>
  </g>

  <!-- Stats (stars + forks) -->
  <text x="${W - PAD - 16}" y="${PAD + 102}"
        text-anchor="end"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="13"
        fill="${TOKYO.muted}">
    ⭐ ${stars}   ⑂ ${forks}
  </text>

  <!-- Repo name (small, bottom-right) -->
  <text x="${W - PAD - 16}" y="${H - PAD - 10}"
        text-anchor="end"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="11"
        fill="${TOKYO.border}">
    ${escapeXml(username)}/${escapeXml(repo)}
  </text>
</svg>
`;

  fs.writeFileSync(outputPath, svg);
  console.log(`Wrote ${outputPath}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
