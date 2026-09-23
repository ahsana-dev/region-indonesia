import { useEffect, useState } from "react";

type Region = { code: string; name: string };

const LEVELS = [
  { label: "Province", path: () => "provinces", placeholder: "Select a province" },
  { label: "Regency / city", path: (code: string) => `regencies/${code}`, placeholder: "Select a regency" },
  { label: "District", path: (code: string) => `districts/${code}`, placeholder: "Select a district" },
  { label: "Village", path: (code: string) => `villages/${code}`, placeholder: "Select a village" },
];

type Request = { url: string; status?: number; body: string };

// Each selection fetches the next level from the API itself.
export function TryIt() {
  const [options, setOptions] = useState<(Region[] | null)[]>([null, null, null, null]);
  const [selected, setSelected] = useState(["", "", "", ""]);
  const [request, setRequest] = useState<Request | null>(null);

  async function load(level: number, parentCode = "") {
    const url = `/api/${LEVELS[level].path(parentCode)}.json`;
    setRequest({ url, body: "…" });
    try {
      const res = await fetch(url);
      if (!res.ok) {
        setRequest({ url, status: res.status, body: `Request failed: ${res.statusText}` });
        return;
      }
      const regions: Region[] = await res.json();
      setRequest({ url, status: res.status, body: JSON.stringify(regions, null, 2) });
      setOptions((prev) => prev.map((list, i) => (i === level ? regions : list)));
    } catch (err) {
      setRequest({ url, body: `Request failed: ${(err as Error).message}` });
    }
  }

  useEffect(() => {
    load(0);
  }, []);

  function select(level: number, code: string) {
    setSelected((prev) => prev.map((value, i) => (i === level ? code : i > level ? "" : value)));
    setOptions((prev) => prev.map((list, i) => (i > level ? null : list)));
    if (code && level + 1 < LEVELS.length) load(level + 1, code);
  }

  const ok = request?.status !== undefined && request.status < 400;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {LEVELS.map((level, i) => (
          <label key={level.label} className="grid gap-1 text-sm text-stone-600 dark:text-stone-400">
            {level.label}
            <select
              value={selected[i]}
              disabled={!options[i]}
              onChange={(e) => select(i, e.target.value)}
              className="w-full rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5 text-stone-900 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
            >
              <option value="">{options[i] ? level.placeholder : "—"}</option>
              {options[i]?.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name} ({region.code})
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="mt-4 mb-2 text-sm break-all text-stone-600 dark:text-stone-400" aria-live="polite">
        <span className={ok ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
          {request?.status ?? ""}
        </span>{" "}
        <code>{request ? `GET ${request.url}` : ""}</code>
      </p>
      <pre className="max-h-72 overflow-auto rounded-md border border-stone-200 bg-stone-100 px-3.5 py-3 text-sm dark:border-stone-800 dark:bg-stone-950">
        <code>{request?.body ?? "…"}</code>
      </pre>
    </div>
  );
}
