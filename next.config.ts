import { realpathSync } from "node:fs";
import { chdir } from "node:process";
import type { NextConfig } from "next";

// Windows: Downloads may resolve as C:\Users\...\Downloads but real path is E:\...
// Next.js breaks if cwd (C:) and realpath (E:) differ — normalize before anything else.
try {
  chdir(realpathSync("."));
} catch {
  /* ignore */
}

// OpenNext Cloudflare dev shim breaks paths on Windows when cwd mixes C: and E: drives.// Enable only for Cloudflare-specific dev: set OPENNEXT_DEV=1
if (process.env.OPENNEXT_DEV === "1") {
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
