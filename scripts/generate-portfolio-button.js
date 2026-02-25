const fs = require("fs");

const [url, outputPath] = process.argv.slice(2);

if (!url || !outputPath) {
  console.error("Usage: node scripts/generate-portfolio-button.js <url> <outputPath>");
  process.exit(1);
}

const TOKYO = {
  bg: "#1a1b26",
  panel: "#24283b",
  border: "#414868",
  text: "#c0caf5",
  muted: "#a9b1d6",
  accent: "#7aa2f7",
};

function escapeXml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const W = 520;
const H = 70;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${W} ${H}" width="100%" height="auto"
  role="img" aria-label="Open portfolio"
  preserveAspectRatio="xMidYMid meet">

  <defs>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TOKYO.accent}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${TOKYO.border}" stop-opacity="0.25"/>
    </linearGradient>
  </defs>

  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16"
        fill="${TOKYO.bg}" stroke="url(#glow)"/>

  <rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="12"
        fill="${TOKYO.panel}" stroke="${TOKYO.border}" stroke-opacity="0.35"/>

  <!-- Icon circle -->
  <circle cx="44" cy="${H / 2}" r="14" fill="${TOKYO.bg}" stroke="${TOKYO.accent}" stroke-opacity="0.55"/>
  <text x="44" y="${H / 2 + 6}" text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="16" fill="${TOKYO.text}">↗</text>

  <!-- Button text -->
  <text x="72" y="${H / 2 - 2}"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="18" font-weight="700" fill="${TOKYO.text}">
    Open Portfolio
  </text>
  <text x="72" y="${H / 2 + 18}"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        font-size="13" fill="${TOKYO.muted}">
    ${escapeXml(url)}
  </text>

  <!-- Right label -->
  <text x="${W - 28}" y="${H / 2 + 6}" text-anchor="end"
        font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        font-size="12" fill="${TOKYO.accent}">
    RUN
  </text>
</svg>
`;

fs.writeFileSync(outputPath, svg);
console.log(`Wrote ${outputPath}`);
