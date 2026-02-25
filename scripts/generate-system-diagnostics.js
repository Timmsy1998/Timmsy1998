const fs = require("fs");

const [username, outputPath] = process.argv.slice(2);

if (!username || !outputPath) {
  console.error("Usage: node scripts/generate-system-diagnostics.js <username> <outputPath>");
  process.exit(1);
}

const TOKYO = {
  bg: "#1a1b26",
  panel: "#24283b",
  border: "#414868",
  text: "#c0caf5",
  muted: "#a9b1d6",
  green: "#9ece6a",
  yellow: "#e0af68",
  red: "#f7768e",
  blue: "#7aa2f7",
  cyan: "#7dcfff",
};

function escapeXml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function ghJson(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "readme-system-diagnostics",
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status} for ${url}\n${txt}`);
  }
  return res.json();
}

async function getAllRepos(user) {
  let page = 1;
  const per_page = 100;
  const repos = [];

  while (true) {
    const batch = await ghJson(
      `https://api.github.com/users/${user}/repos?per_page=${per_page}&page=${page}&sort=updated`
    );
    repos.push(...batch);
    if (batch.length < per_page) break;
    page++;
  }

  return repos;
}

function format(n) {
  try {
    return Number(n).toLocaleString("en-GB");
  } catch {
    return String(n);
  }
}

function daysSince(iso) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
  return days;
}

async function run() {
  const user = await ghJson(`https://api.github.com/users/${username}`);
  const repos = await getAllRepos(username);

  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);

  const accountDays = daysSince(user.created_at);
  const accountYears = (accountDays / 365).toFixed(1);

  const W = 900;
  const H = 220;

  const lines = [
    `[BOOT] timmsyOS 1.0.0 (tokyonight build)`,
    `[INFO] user: ${username}`,
    `[OK]   profile: online`,
    `[STAT] repos: ${format(user.public_repos)} | stars: ${format(totalStars)} | forks: ${format(totalForks)}`,
    `[STAT] followers: ${format(user.followers)} | following: ${format(user.following)}`,
    `[INFO] account_age: ${format(accountDays)} days (${accountYears} years)`,
  ];

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${W} ${H}" width="100%" height="auto"
  role="img" aria-label="GitHub system diagnostics"
  preserveAspectRatio="xMidYMid meet">

  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16"
        fill="${TOKYO.bg}" stroke="${TOKYO.border}" />

  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="12"
        fill="${TOKYO.panel}" stroke="${TOKYO.border}" stroke-opacity="0.35"/>

  <!-- Header -->
  <text x="30" y="48"
    font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    font-size="16" fill="${TOKYO.cyan}">
    $ systemctl status github
  </text>

  <!-- Status pill -->
  <g transform="translate(${W - 220}, 30)">
    <rect x="0" y="0" width="180" height="28" rx="14" fill="${TOKYO.bg}" stroke="${TOKYO.green}" stroke-opacity="0.55"/>
    <circle cx="18" cy="14" r="6" fill="${TOKYO.green}"/>
    <text x="34" y="19"
      font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      font-size="12" fill="${TOKYO.text}">
      ACTIVE (RUNNING)
    </text>
  </g>

  <!-- Lines -->
  ${lines
    .map((l, i) => {
      const y = 86 + i * 22;
      const color =
        l.startsWith("[OK]") ? TOKYO.green :
        l.startsWith("[STAT]") ? TOKYO.blue :
        l.startsWith("[BOOT]") ? TOKYO.yellow :
        TOKYO.muted;

      return `<text x="30" y="${y}"
        font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        font-size="13" fill="${color}">${escapeXml(l)}</text>`;
    })
    .join("\n")}
</svg>
`;

  fs.writeFileSync(outputPath, svg);
  console.log(`Wrote ${outputPath}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
