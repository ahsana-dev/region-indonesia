import { useEffect, useState, type ReactNode } from "react";

import type { Route } from "./+types/home";
import { CodeBlock } from "../docs/code-block";
import { getStats } from "../docs/stats.server";
import { TryIt } from "../docs/try-it";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Indonesia Region API" },
    {
      name: "description",
      content:
        "Static JSON API of Indonesian administrative regions: provinces, regencies/cities, districts and villages.",
    },
  ];
}

// Prerendered at build time, so this reads the generated files in public/api.
export async function loader() {
  return getStats();
}

const PLACEHOLDER_ORIGIN = "https://your-site.pages.dev";

const ENDPOINTS = [
  { path: "/api/provinces.json", returns: "All provinces", example: "/api/provinces.json" },
  { path: "/api/regencies/{provinceCode}.json", returns: "Regencies and cities in a province", example: "/api/regencies/11.json" },
  { path: "/api/districts/{regencyCode}.json", returns: "Districts in a regency or city", example: "/api/districts/11.01.json" },
  { path: "/api/villages/{districtCode}.json", returns: "Villages in a district", example: "/api/villages/11.01.01.json" },
];

const CODE_LEVELS = [
  { level: "Province", format: "PP", code: "11", name: "Aceh" },
  { level: "Regency / city", format: "PP.RR", code: "11.01", name: "Kabupaten Aceh Selatan" },
  { level: "District", format: "PP.RR.DD", code: "11.01.01", name: "Bakongan" },
  { level: "Village", format: "PP.RR.DD.VVVV", code: "11.01.01.2001", name: "Keude Bakongan" },
];

const RESPONSE_EXAMPLE = `[
  { "code": "11.01", "name": "Kabupaten Aceh Selatan" },
  { "code": "11.02", "name": "Kabupaten Aceh Tenggara" }
]`;

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-stone-200 bg-stone-100 px-1.5 py-px text-[0.9em] text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
      {children}
    </code>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-12 border-t border-stone-200 pt-2 dark:border-stone-800">
      <h2 className="mt-2 mb-3 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border-b border-stone-200 px-3.5 py-2.5 text-left text-xs font-semibold tracking-wide text-stone-500 uppercase dark:border-stone-800 dark:text-stone-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-stone-200 last:border-0 dark:border-stone-800">
              {cells.map((cell, j) => (
                <td key={j} className="px-3.5 py-2.5 align-top whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { provinces, regencies, districts, villages, generated } = loaderData;

  // Examples show the real domain once running in the browser.
  const [origin, setOrigin] = useState(PLACEHOLDER_ORIGIN);
  useEffect(() => setOrigin(location.origin), []);

  const stats = [
    { value: provinces, label: "provinces" },
    { value: regencies, label: "regencies / cities" },
    { value: districts, label: "districts" },
    { value: villages, label: "villages" },
  ];

  const jsExample = `const BASE = "${origin}/api";

async function getRegions(path) {
  const res = await fetch(\`\${BASE}/\${path}.json\`);
  if (!res.ok) throw new Error(\`Region not found: \${path}\`);
  return res.json();
}

const provinces = await getRegions("provinces");
const regencies = await getRegions(\`regencies/\${provinces[0].code}\`);`;

  return (
    <main className="mx-auto max-w-4xl px-4 pt-12 pb-16 leading-relaxed text-stone-900 dark:text-stone-100 [&_p]:text-stone-600 dark:[&_p]:text-stone-400">
      <header>
        <h1 className="mb-2 text-3xl leading-tight font-bold">Indonesia Region API</h1>
        <p className="text-lg">
          A free, static JSON API of Indonesia's administrative regions: provinces, regencies/cities, districts and
          villages. No API key, no rate limits, and any website can call it (CORS enabled).
        </p>
        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {stats.map(({ value, label }) => (
            <div key={label} className="rounded-lg border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
              <b className="block text-2xl tabular-nums">{value.toLocaleString("en-US")}</b>
              <span className="text-sm text-stone-500 dark:text-stone-400">{label}</span>
            </div>
          ))}
        </div>
      </header>

      <Section id="endpoints" title="Endpoints">
        <p className="mb-3">
          All endpoints are <InlineCode>GET</InlineCode> requests for static files under{" "}
          <InlineCode>{origin}/api/</InlineCode>.
        </p>
        <Table
          head={["Endpoint", "Returns", "Example"]}
          rows={ENDPOINTS.map(({ path, returns, example }) => [
            <InlineCode>{path}</InlineCode>,
            <span className="whitespace-normal">{returns}</span>,
            <a href={example} className="text-red-700 underline dark:text-red-400">
              <code>{example.replace("/api/", "")}</code>
            </a>,
          ])}
        />
      </Section>

      <Section id="response-format" title="Response format">
        <p>
          Every endpoint returns a JSON array of <InlineCode>{"{ code, name }"}</InlineCode> objects, sorted by code.
        </p>
        <CodeBlock code={RESPONSE_EXAMPLE} />

        <h3 className="mt-6 mb-2 font-semibold">Region codes</h3>
        <p className="mb-3">
          Codes follow the official Kemendagri format. Each level adds a dot-separated segment to its parent's code, so
          a region's parent can always be read from its own code.
        </p>
        <Table
          head={["Level", "Format", "Example"]}
          rows={CODE_LEVELS.map(({ level, format, code, name }) => [
            level,
            <InlineCode>{format}</InlineCode>,
            <>
              <InlineCode>{code}</InlineCode> {name}
            </>,
          ])}
        />

        <h3 className="mt-6 mb-2 font-semibold">Errors</h3>
        <p>
          A code that does not exist returns HTTP <InlineCode>404</InlineCode>. Always check{" "}
          <InlineCode>response.ok</InlineCode> before parsing the body.
        </p>
      </Section>

      <Section id="examples" title="Examples">
        <h3 className="mt-4 mb-2 font-semibold">JavaScript</h3>
        <CodeBlock code={jsExample} />
        <h3 className="mt-6 mb-2 font-semibold">curl</h3>
        <CodeBlock code={`curl ${origin}/api/districts/11.01.json`} />
      </Section>

      <Section id="try" title="Try it">
        <p className="mb-3">Each selection fetches the next level from this API.</p>
        <TryIt />
      </Section>

      <footer className="mt-14 border-t border-stone-200 pt-4 text-sm dark:border-stone-800">
        <p>
          Data source:{" "}
          <a href="https://github.com/cahyadsn/wilayah" className="text-red-700 underline dark:text-red-400">
            cahyadsn/wilayah
          </a>{" "}
          by cahya dsn (
          <a href="https://github.com/cahyadsn/wilayah/blob/master/LICENSE" className="text-red-700 underline dark:text-red-400">
            MIT License
          </a>
          ), based on Kepmendagri No 300.2.2-2430 Tahun 2025. Many thanks to the author for compiling and maintaining
          this data.
        </p>
        <p className="mt-2">Generated {generated}.</p>
      </footer>
    </main>
  );
}
