/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Nothing in this app renders through next/image — product image URLs are
    // fetched into `imageUrl` but never displayed — so the Image Optimization
    // API is dead weight here. Leaving `remotePatterns` pointing at
    // openfoodfacts.org let /_next/image be asked to fetch and transcode
    // arbitrary images from a database anyone can upload to, which is the
    // reachable half of GHSA-2xp9-vwfh-vxw4 (unauthenticated RCE via AVIF,
    // unpatched in every 14.x). Turning the optimizer off costs nothing today.
    // Re-enable it, on a version >= 15.5.24, if you start using next/image.
    unoptimized: true,
  },
};

module.exports = nextConfig;
