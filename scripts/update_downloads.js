// scripts/update_downloads.js
// Node 18+ (GitHub Actions 默认支持)
const fs = require("fs");

async function fetchRepoDownloads(owner, repo, headers) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error for ${owner}/${repo} ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected API response for ${owner}/${repo}: not an array`);
  }

  let total = 0;
  for (const release of data) {
    if (!release || !Array.isArray(release.assets)) continue;
    for (const asset of release.assets) {
      total += Number(asset.download_count || 0);
    }
  }

  return total;
}

async function main() {
  const owner = "guijiejie";
  const repos = ["PatternRecognition", "PatternRecognition_v2"];

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "downloads-updater",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // 可选：提高 API 限额
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // 并发拉两个 repo
  const results = await Promise.all(
    repos.map(async (repo) => {
      const total = await fetchRepoDownloads(owner, repo, headers);
      return { repo: `${owner}/${repo}`, total_downloads: total };
    })
  );

  const grandTotal = results.reduce((sum, item) => sum + item.total_downloads, 0);

  const payload = {
    repos: results,
    grand_total_downloads: grandTotal,
    updated_at_utc: new Date().toISOString(),
  };

  fs.writeFileSync(
    "downloads.json",
    JSON.stringify(payload, null, 2) + "\n",
    "utf8"
  );

  console.log("Wrote downloads.json:", payload);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
