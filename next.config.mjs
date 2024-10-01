/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      config.module.rules.push({
        test: /\.(ogg|mp3|wav|mpe?g)$/i,
        exclude: config.exclude,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              fallback: 'file-loader',
              publicPath: '/_next/static/sounds/',
              outputPath: `${isServer ? '../' : ''}static/sounds/`,
              name: '[name]-[hash].[ext]',
            },
          },
        ],
      });
  
      return config;
    },
  };

export default nextConfig;
