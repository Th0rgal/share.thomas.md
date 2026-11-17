/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Glamsterdam notes moved to share.veritylabs.dev on 17 Nov 2026.
  async redirects() {
    return [
      {
        source: '/:page(glamsterdam(?:_gas|_8246|_epbs)?(?:\\.md)?)',
        destination: 'https://share.veritylabs.dev/:page',
        permanent: true
      }
    ]
  },
  transpilePackages: ["@starknet-io/get-starknet", "starknetkit", "starknet"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
      ".mjs": [".mjs", ".js"],
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
}

export default nextConfig
