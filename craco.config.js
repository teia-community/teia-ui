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
  style: {
    modules: {
      // localIdentName: '[hash:base64]',
    },
  },
  webpack: {
    alias: {
      '@atoms': path.resolve(__dirname, 'src/atoms'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@icons': path.resolve(__dirname, 'src/icons'),
      '@style': './index.module.scss',
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@utils': path.resolve(__dirname, 'src/utils'),
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
