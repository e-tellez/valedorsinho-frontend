/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Use `fallback` so Next.js App Router route handlers always take precedence.
    // Requests that have no matching Next.js handler fall through to the Railway
    // backend. Previously the plain-array form was used, which behaves like
    // `afterFiles` — in practice Railway was still winning for routes like
    // /api/webhooks/[id] because the rewrite ran before App Router handlers
    // were resolved, causing "Application not found" 404s from Railway.
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${process.env.VALEDORSINHO_API_URL ?? "http://localhost:8000"}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
