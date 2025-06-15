/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@cnp-tcg/common-types', '@cnp-tcg/card-database'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['react-dnd', 'react-dnd-html5-backend', 'react-dnd-touch-backend']
  },
  webpack: (config, { dev, isServer, webpack }) => {
    if (dev && !isServer) {
      // Remove all HMR and Fast Refresh related plugins
      config.plugins = config.plugins.filter(plugin => {
        const pluginName = plugin.constructor.name;
        return !pluginName.includes('HotModuleReplacementPlugin') &&
               !pluginName.includes('ReactRefreshWebpackPlugin') &&
               !pluginName.includes('webpack-hot-middleware');
      });
      
      // Disable hot reloading completely
      if (config.entry && typeof config.entry !== 'function') {
        for (const key of Object.keys(config.entry)) {
          if (Array.isArray(config.entry[key])) {
            config.entry[key] = config.entry[key].filter(entry => 
              !entry.includes('webpack-hot-middleware') && 
              !entry.includes('react-refresh') &&
              !entry.includes('fast-refresh')
            );
          }
        }
      }
      
      // Disable file watching
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
        poll: false,
      };
      
      // Disable caching
      config.cache = false;
      
      // Add webpack define plugin to disable fast refresh
      config.plugins.push(
        new webpack.DefinePlugin({
          __REACT_REFRESH__: false,
          'process.env.__REACT_REFRESH__': JSON.stringify(false),
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;