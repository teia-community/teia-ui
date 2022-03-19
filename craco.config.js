const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          crypto: require.resolve('crypto-browserify'),
          process: require.resolve("process/browser"),
          zlib: require.resolve("browserify-zlib"),
          stream: require.resolve("stream-browserify"),
          util: require.resolve("util"),
          buffer: require.resolve("buffer"),
          assert: require.resolve("assert"),
          path: require.resolve("path-browserify")
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      ],
    },
  },
};
