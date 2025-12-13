import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - turbopack.root is valid but not in types yet
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
