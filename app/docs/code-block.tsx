import { useState } from "react";

export function CodeBlock({ code }: { code: string }) {
  const [label, setLabel] = useState("Copy");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setLabel("Copied");
    } catch {
      setLabel("Copy failed");
    }
    setTimeout(() => setLabel("Copy"), 1500);
  }

  return (
    <div className="relative my-3">
      <pre className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-100 px-4 py-3.5 text-sm dark:border-stone-800 dark:bg-stone-900">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 cursor-pointer rounded-md border border-stone-200 bg-white px-2.5 py-0.5 text-xs text-stone-600 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
      >
        {label}
      </button>
    </div>
  );
}
