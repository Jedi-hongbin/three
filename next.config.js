/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  compiler: {
    styledComponents: true,
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.glb/,
      use: [
        options.defaultLoaders.babel,
        {
          loader: 'file-loader'
        },
      ],
      test: /\.glsl/,
      use: [
        options.defaultLoaders.babel,
        {
          loader: 'raw-loader'
        },
      ],
    });

    // 为了支持 ammo.js 物理引擎
    config.resolve.extensions.push('.js');
    config.resolve.fallback = { fs: false };
    // 
    config.resolve.alias.path = require.resolve('path-browserify')

    return config
  },
}

module.exports = nextConfig
