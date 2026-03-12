/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ignora erros de TypeScript no build da Vercel
  },
  eslint: {
    ignoreDuringBuilds: true, // ignora erros de ESLint no build da Vercel
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

module.exports = nextConfig
