import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'hjnonzdqiohbvsxkyjth.supabase.co',
				pathname: '/storage/v1/object/public/product-images/**',
			},
		],
	},
}

export default nextConfig
