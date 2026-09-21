import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mitigate Windows access-violation crashes in build workers
  // (seen on this machine / OneDrive-synced environments).
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
