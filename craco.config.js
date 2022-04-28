const webpack = require("webpack");
const path = require("path");
module.exports = {
  webpack: {
    alias: {
      '@data': path.resolve(__dirname, 'src/data'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@icons': path.resolve(__dirname, 'src/icons'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
    },
    configure: {
      resolve: {
        fallback: {
          // assert: require.resolve("assert"),
          // process: require.resolve("process/browser"),
          // util: require.resolve("util"),
          // zlib: require.resolve("browserify-zlib"),
          buffer: require.resolve("buffer/"),
          crypto: require.resolve("crypto-browserify"),
          stream: require.resolve("stream-browserify"),
          // events: require.resolve("events/"),
          path: require.resolve("path-browserify"),
          // http: require.resolve("stream-http"),
          // https: require.resolve("https-browserify"),
          // os: require.resolve("os-browserify/browser"),
          // url: require.resolve("url")
        },
      },
      // experiments: { asyncWebAssembly: true },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      ],
    },
  },
};
