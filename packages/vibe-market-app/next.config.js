const withTM = require("next-transpile-modules")([
  "@solana/wallet-adapter-react",
  "@solana/wallet-adapter-react-ui",
  "@solana/wallet-adapter-base",
])

/** @type {import('next').NextConfig} */
module.exports = withTM({
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false
    }
    return config
  },
  redirects: async function () {
    return [
      {
        source: "/",
        destination: "/collection/9BZ8qv66erfbNd9ptaBXPVUhbvXjmq5dwHrEFekaypjv",
        permanent: false,
      },
    ]
  },
})
