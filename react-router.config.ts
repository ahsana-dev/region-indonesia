import type { Config } from "@react-router/dev/config";

export default {
  // Static output only: "/" (the API docs) is rendered to HTML at build time.
  ssr: false,
  prerender: ["/"],
} satisfies Config;
