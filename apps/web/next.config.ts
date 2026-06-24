import "./src/env";
import type { NextConfig } from "next";

const devOrigins = [
  "https://sterility-greyhound-width.ngrok-free.dev",
  "https://engducationgroup.vercel.app",
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,

  // Cho phép dev origins (ngrok, localtunnel, v.v.)
  allowedDevOrigins: devOrigins.map((o) => o.replace(/^https?:\/\//, "")),

  // CORS cho toàn bộ API routes
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: devOrigins[0]! },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-SePay-Signature" },
        ],
      },
    ];
  },
};

export default nextConfig;
