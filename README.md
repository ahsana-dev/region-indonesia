# Indonesia Region API

A static JSON API of Indonesia's administrative regions (provinces, regencies/cities, districts and villages), hosted on Cloudflare Pages. It needs no API key, has no server code, and any website can call it (CORS enabled).

| Level | Count |
| --- | ---: |
| Provinces | 38 |
| Regencies / cities | 514 |
| Districts | 7,285 |
| Villages | 83,762 |

Interactive docs are served at the site root (`/`); `/api` and `/api/` redirect there.

## Endpoints

All endpoints are `GET` requests for static files.

| Endpoint | Returns | Example |
| --- | --- | --- |
| `/api/provinces.json` | All provinces | `/api/provinces.json` |
| `/api/regencies/{provinceCode}.json` | Regencies and cities in a province | `/api/regencies/11.json` |
| `/api/districts/{regencyCode}.json` | Districts in a regency or city | `/api/districts/11.01.json` |
| `/api/villages/{districtCode}.json` | Villages in a district | `/api/villages/11.01.01.json` |

A code that does not exist returns HTTP `404`.

### Response format

Every endpoint returns a JSON array of `{ code, name }` objects, sorted by code:

```json
[
  { "code": "11.01", "name": "Kabupaten Aceh Selatan" },
  { "code": "11.02", "name": "Kabupaten Aceh Tenggara" }
]
```

### Region codes

Codes follow the official Kemendagri format. Each level adds a dot-separated segment to its parent's code:

| Level | Format | Example |
| --- | --- | --- |
| Province | `PP` | `11` Aceh |
| Regency / city | `PP.RR` | `11.01` Kabupaten Aceh Selatan |
| District | `PP.RR.DD` | `11.01.01` Bakongan |
| Village | `PP.RR.DD.VVVV` | `11.01.01.2001` Keude Bakongan |

### Calling from the browser (CORS)

Every `/api/*` response includes these headers (set in `public/_headers`), so JavaScript on any website can call the API directly with `fetch`: from your own domain, another domain, or `localhost` during development. No proxy or backend is needed.

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
```

To keep requests working from the browser:

- Use a plain `GET` request, like `fetch(url)`. Only `GET` and `HEAD` are supported.
- Don't add custom request headers (such as `Authorization` or `Content-Type`). They make the browser send an `OPTIONS` preflight request first, which a static site cannot answer (it returns `405`), so the request fails.
- Don't set `credentials: "include"`. Browsers reject a wildcard `*` origin for credentialed requests, and the API needs no cookies or keys anyway.

### Example

```js
const BASE = "https://your-site.pages.dev/api";

async function getRegions(path) {
  const res = await fetch(`${BASE}/${path}.json`);
  if (!res.ok) throw new Error(`Region not found: ${path}`);
  return res.json();
}

const provinces = await getRegions("provinces");
const regencies = await getRegions(`regencies/${provinces[0].code}`);
```

## Development

Requires Node.js 22 or later.

```bash
npm install
npm run generate:api   # build public/api/ from the source SQL
npm run build          # generate the API, then build the site into build/client/
npm run preview        # serve build/client/ locally as Cloudflare Pages would
npm run deploy         # build and deploy to Cloudflare Pages
```

`npm run generate:api` reads `data/wilayah.sql`, downloading it from the source repository if it is missing. To use a different copy, pass its path: `node scripts/generate-api.mjs path/to/wilayah.sql`. To pick up new upstream data, delete `data/wilayah.sql` and rebuild.

The generator also:

- stops with an error on duplicate codes, unexpected code formats, or regions whose parent is missing
- writes a `404.html` for missing `/api/*` paths
- stops with an error if the output exceeds Cloudflare Pages limits: 20,000 files (set `PAGES_FILE_LIMIT=100000` on paid plans) or 25 MiB per file

`public/api/` and `data/` are generated, so they are not committed.

The docs page is the React Router route `app/routes/home.tsx`. It is prerendered to `build/client/index.html` at build time (`prerender: ["/"]` with `ssr: false`), and its record counts come from the generated files in `public/api/`.

## Deployment

This is a static **Cloudflare Pages** site, not a Worker. `wrangler.jsonc` sets `pages_build_output_dir`; do not add a `main` entry, a `functions/` directory or a `_worker.js`.

To deploy from Git in the Cloudflare dashboard, create a **Pages** project with:

- Build command: `npm run build`
- Build output directory: `build/client`

CORS headers for `/api/*` are set in `public/_headers`, and the `/api` → `/` redirects in `public/_redirects`.

## Credits

The region data comes from [cahyadsn/wilayah](https://github.com/cahyadsn/wilayah) by cahya dsn, released under the [MIT License](https://github.com/cahyadsn/wilayah/blob/master/LICENSE) and based on Kepmendagri No 300.2.2-2430 Tahun 2025. Many thanks to the author for compiling and maintaining this data.
