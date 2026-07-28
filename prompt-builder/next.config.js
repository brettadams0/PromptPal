/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // remotePatterns rather than the deprecated `domains` array. Empty because
    // every image here is local; add entries before referencing a remote host.
    remotePatterns: [],
    formats: ['image/webp', 'image/avif'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // `swcMinify` is gone in Next 15 — SWC minification is always on, and an
  // unrecognized key warns on every build.
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  typescript: {
    // Type errors must fail the build. CI also runs `tsc --noEmit` separately.
    ignoreBuildErrors: false,
  },
  // No `eslint` block: the ESLint 8 toolchain was removed (it was installed but
  // had no config file, and was the source of ~18 high-severity advisories).
};

module.exports = nextConfig;
