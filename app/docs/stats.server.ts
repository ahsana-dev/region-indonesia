import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Runs at build time (prerender) against the output of scripts/generate-api.mjs.
const API_DIR = path.resolve("public/api");

async function countRegions(dir: string) {
  const files = await readdir(path.join(API_DIR, dir));
  let total = 0;
  for (const file of files) {
    const regions = JSON.parse(await readFile(path.join(API_DIR, dir, file), "utf8"));
    total += regions.length;
  }
  return total;
}

export async function getStats() {
  const provinces = JSON.parse(await readFile(path.join(API_DIR, "provinces.json"), "utf8"));
  return {
    provinces: provinces.length as number,
    regencies: await countRegions("regencies"),
    districts: await countRegions("districts"),
    villages: await countRegions("villages"),
    generated: new Date().toISOString().slice(0, 10),
  };
}
