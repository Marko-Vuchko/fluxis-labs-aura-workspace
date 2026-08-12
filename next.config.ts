import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: {
    position: "bottom-left",
  },
};

export default withBotId(nextConfig);
