const webpack = require('webpack')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const commitHash = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString()
  .trim()

// react-pdf
const cMapsDir = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'cmaps'
)
const standardFontsDir = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'standard_fonts'
)
const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'))
const pdfWorkerPath = path.join(pdfjsDistPath, 'build', 'pdf.worker.min.js')

process.env['REACT_APP_BUILD_COMMIT'] = commitHash

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
          buffer: require.resolve('buffer/'),
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          path: require.resolve('path-browserify'),
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
        new CopyWebpackPlugin({
          patterns: [
            { from: pdfWorkerPath },
            { from: cMapsDir, to: 'cmaps/' },
            { from: standardFontsDir, to: 'standard_fonts/' },
          ],
        }),
      ],
    },
  },
}
