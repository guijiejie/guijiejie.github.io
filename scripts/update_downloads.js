// scripts/update_downloads.js
// Node 18+ (GitHub Actions 默认支持)
const fs = require("fs");

async function main() {
  const owner = "guijiejie";
  const repo = "PatternRecognition";
  const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`;

  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "downloads-updater"
  };

  // 可选：使用 token 提升 API 限额（推荐，但不强制）
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected API response: not an array");
  }

  let total = 0;
  for (const release of data) {
    if (!release || !Array.isArray(release.assets)) continue;
    for (const asset of release.assets) {
      total += Number(asset.download_count || 0);
    }
  }

  const payload = {
    source: `${owner}/${repo}`,
    total_downloads: total,
    updated_at_utc: new Date().toISOString()
  };

  fs.writeFileSync("downloads.json", JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("Wrote downloads.json:", payload);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
