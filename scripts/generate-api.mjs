// Generates the static JSON API from cahyadsn/wilayah's db/wilayah.sql.
//
// Output (under public/api/):
//   provinces.json                    all provinces
//   regencies/{provinceCode}.json     regencies/cities in a province
//   districts/{regencyCode}.json      districts in a regency/city
//   villages/{districtCode}.json      villages in a district
//   404.html                          returned for missing /api/* paths
//
// Usage: node scripts/generate-api.mjs [path/to/wilayah.sql]
// If the SQL file is missing, it is downloaded from GitHub first.

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_URL =
  "https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql";
const SQL_PATH = path.resolve(process.argv[2] ?? path.join(ROOT, "data/wilayah.sql"));
const OUT_DIR = path.join(ROOT, "public/api");

// Code segments per level: 11 / 11.01 / 11.01.01 / 11.01.01.2001
const LEVELS = ["province", "regency", "district", "village"];

// Cloudflare Pages limits: 20,000 files per site on the Free plan (100,000 on
// paid plans) and 25 MiB per file. Override the file limit with PAGES_FILE_LIMIT.
const FILE_LIMIT = Number(process.env.PAGES_FILE_LIMIT ?? 20_000);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

// Pages serves the nearest 404.html for missing paths; without this one it
// falls back to the SPA's index.html with a 200 status.
const NOT_FOUND_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>404 Not Found</title></head>
<body><h1>404 Not Found</h1><p>No region data exists at this path.</p></body>
</html>
`;

async function loadSql() {
  if (!existsSync(SQL_PATH)) {
    console.log(`Downloading ${SOURCE_URL}`);
    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    await mkdir(path.dirname(SQL_PATH), { recursive: true });
    await writeFile(SQL_PATH, await res.text());
  }
  return readFile(SQL_PATH, "utf8");
}

// Matches ('kode','nama') tuples; SQL escapes a quote inside a string as ''.
function parseRows(sql) {
  const re = /\('([0-9.]+)','((?:[^']|'')*)'\)/g;
  const rows = [];
  for (const [, code, name] of sql.matchAll(re)) {
    rows.push({ code, name: name.replaceAll("''", "'").trim() });
  }
  return rows;
}

function groupByParent(rows) {
  const byLevel = Object.fromEntries(LEVELS.map((level) => [level, new Map()]));
  const seen = new Set();

  for (const { code, name } of rows) {
    if (seen.has(code)) throw new Error(`Duplicate code: ${code}`);
    seen.add(code);

    const parts = code.split(".");
    const level = LEVELS[parts.length - 1];
    if (!level) throw new Error(`Unexpected code format: ${code}`);

    const parent = parts.slice(0, -1).join(".");
    const children = byLevel[level];
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push({ code, name });
  }

  // Every non-province row must point to an existing parent.
  for (const level of LEVELS.slice(1)) {
    for (const parent of byLevel[level].keys()) {
      if (!seen.has(parent)) throw new Error(`Orphan ${level} rows under missing parent ${parent}`);
    }
  }

  for (const children of Object.values(byLevel)) {
    for (const list of children.values()) list.sort((a, b) => a.code.localeCompare(b.code));
  }
  return byLevel;
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data));
}

// Counts what actually landed in OUT_DIR and fails if Pages would reject it.
async function checkPagesLimits() {
  const entries = await readdir(OUT_DIR, { recursive: true, withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile());

  let largest = { file: "", size: 0 };
  for (const entry of files) {
    const file = path.join(entry.parentPath, entry.name);
    const { size } = await stat(file);
    if (size > largest.size) largest = { file: path.relative(OUT_DIR, file), size };
  }

  const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
  console.log(
    `api files=${files.length} (limit ${FILE_LIMIT}, ${FILE_LIMIT - files.length} left) ` +
      `largest=${largest.file} ${kb(largest.size)}`,
  );

  if (files.length > FILE_LIMIT) {
    throw new Error(`${files.length} files exceeds the Cloudflare Pages limit of ${FILE_LIMIT}`);
  }
  if (largest.size > MAX_FILE_BYTES) {
    throw new Error(`${largest.file} is ${kb(largest.size)}, over the 25 MiB Pages file limit`);
  }
}

async function main() {
  const rows = parseRows(await loadSql());
  if (rows.length === 0) throw new Error(`No rows parsed from ${SQL_PATH}`);
  const byLevel = groupByParent(rows);

  await rm(OUT_DIR, { recursive: true, force: true });

  const provinces = byLevel.province.get("") ?? [];
  await writeJson(path.join(OUT_DIR, "provinces.json"), provinces);

  const dirs = { regency: "regencies", district: "districts", village: "villages" };
  for (const [level, dir] of Object.entries(dirs)) {
    for (const [parent, children] of byLevel[level]) {
      await writeJson(path.join(OUT_DIR, dir, `${parent}.json`), children);
    }
  }

  await writeFile(path.join(OUT_DIR, "404.html"), NOT_FOUND_HTML);

  const count = (level) => [...byLevel[level].values()].reduce((n, list) => n + list.length, 0);
  console.log(
    `provinces=${provinces.length} regencies=${count("regency")} ` +
      `districts=${count("district")} villages=${count("village")}`,
  );

  await checkPagesLimits();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
