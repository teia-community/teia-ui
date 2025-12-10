import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import child_process from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import viteTsconfigPaths from 'vite-tsconfig-paths'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// const viteTsconfigPaths = require('vite-tsconfig-paths').default || require('vite-tsconfig-paths')
const svgrPlugin = require('vite-plugin-svgr').default || require('vite-plugin-svgr')
const eslintPlugin = require('vite-plugin-eslint').default || require('vite-plugin-eslint')
const { copySync } = require('fs-extra')
const rollupNodePolyFill = require('rollup-plugin-polyfill-node').default || require('rollup-plugin-polyfill-node')
const mdPlugin = require('vite-plugin-markdown').plugin || require('vite-plugin-markdown').default || require('vite-plugin-markdown')
const { ViteEjsPlugin } = require('vite-plugin-ejs')
const filterReplace = require('vite-plugin-filter-replace').default || require('vite-plugin-filter-replace')

// Gets the current git commit (used in <head>)
const commitHash = child_process
  .execSync('git rev-parse HEAD')
  .toString()
  .trim()

/**
 * React PDF Copy plugin
 * I could not find an official way to use with vite, this small plugin
 * does what is explained here: https://github.com/wojtekmaj/react-pdf/blob/v5.x/README.md
 * but for Vitejs
 * @type {import('vite').PluginOption}
 * */
const copyPdfData = () => {
  const prod = process.env.NODE_ENV === 'production'
  const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'))
  const pdfWorkerPath = path.join(pdfjsDistPath, 'build', 'pdf.worker.min.js')
  const cMapsDir = path.join(pdfjsDistPath, 'cmaps')
  const standardFontsDir = path.join(pdfjsDistPath, 'standard_fonts')

  const copy_data = (root = '') => {
    copySync(pdfWorkerPath, `${root}pdf.worker.min.js`, {
      overwrite: true,
    })
    copySync(cMapsDir, `${root}cmaps/`, {
      overwrite: true,
    })
    copySync(standardFontsDir, `${root}standard_fonts/`, {
      overwrite: true,
    })
  }
  return {
    name: 'vite-plugin-copy-react-pdf',
    buildStart: !prod
      ? () => {
        copy_data('public/')
      }
      : null,
    writeBundle: prod
      ? () => {
        copy_data('build/')
      }
      : null,
  }
}

// Project based aliases
const teiaAliases = {
  '@atoms': path.resolve(__dirname, 'src', 'atoms'),
  '@components': path.resolve(__dirname, 'src', 'components'),
  '@constants': path.resolve(__dirname, 'src', 'constants'),
  '@context': path.resolve(__dirname, 'src', 'context'),
  '@data': path.resolve(__dirname, 'src', 'data'),
  '@pages': path.resolve(__dirname, 'src', 'pages'),
  '@hooks': path.resolve(__dirname, 'src', 'hooks'),
  '@icons': path.resolve(__dirname, 'src', 'icons'),
  '@styles': path.resolve(__dirname, 'src', 'styles'),
  '@style': './index.module.scss',
  '@utils': path.resolve(__dirname, 'src', 'utils'),
  '@types': path.resolve(__dirname, 'src', 'types.d.ts'),
  '../core/compat/globalThis': 'node_modules/@magenta/music/esm/core/compat/global.js',
  './evaluate-audio-worklet-globalThis-scope-function': 'node_modules/standardized-audio-context/build/es2019/types/evaluate-audio-worklet-global-scope-function.js'
}

// manual chunking
// anything not listed here will be processed by splitVendorChunkPlugin

const chunkGroups = {
  three: ['three'],
  contracts: [
    '@taquito/beacon-wallet',
    '@taquito/michelson-encoder',
    '@stablelib/ed25519',
    '@stablelib/nacl',
    '@stablelib/x25519-session',
    '@taquito/taquito',
  ],
  pdf: ['react-pdf', 'pdfjs-dist'],
  ui: [
    'classnames',
    'prop-types',
    'react',
    'react-router-dom',
    'react-dom',
    'framer-motion',
    'zustand',
  ],
}

function manualChunks(id) {
  if (!id.includes('node_modules')) return

  for (const [chunkName, packages] of Object.entries(chunkGroups)) {
    if (packages.some(pkg => id.includes(`/node_modules/${pkg}/`))) {
      return chunkName
    }
  }

  // fallback to Vite's default vendor chunking
  return splitVendorChunk(id)
}

export default defineConfig(({ mode }) => {
  const prod = mode === 'production'

  let prod_plugs = []

  if (prod) {
    prod_plugs.push(eslintPlugin())
  }

  return {
    base: process.env.GH_BASE_URL || '/',
    clearScreen: prod,
    appType: 'mpa',
    plugins: [
      ...prod_plugs,
      filterReplace(
        [
          {
            filter: 'node_modules/@airgap/beacon-ui/dist/esm/utils/qr.js',
            replace: {
              from: "import * as qrcode from 'qrcode-generator';",
              to: "import qrcode from 'qrcode-generator';",
            },
          },
          {
            filter: [
              'node_modules/@airgap/beacon-dapp/dist/walletbeacon.dapp.min.js',
              'node_modules/@airgap/beacon-ui/dist/cjs/ui/alert/alert-templates.js',
              'node_modules/@airgap/beacon-ui/dist/esm/ui/alert/alert-templates.js',
            ],
            replace: {
              from: /\\n@media\s*\(min-height:\s*700px\).*translateY\(-50%\);\\n\s*\}\\n\}/g,
              to: '',
            },
          },
        ],
        {
          apply: 'build',
          enforce: 'post',
        }
      ),
      react(),
      // splitVendorChunkPlugin(),
      viteTsconfigPaths(),
      // import svg as ReactComponent
      svgrPlugin(),
      // import md as ReactComponent
      mdPlugin({ mode: 'react' }),
      // our custom plugin
      //copyPdfData(),
      // EJS replacement in HTML
      ViteEjsPlugin({
        BUILD_COMMIT: commitHash,
      }),
    ],
    define: {
      global: 'globalThis',
    },
    server: {
      host: true,
      port: 3000,
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true
      },
      outDir: 'build',
      sourcemap: !prod,
      rollupOptions: {
        plugins: [rollupNodePolyFill()],
        output: {
          manualChunks: {
            three: ['three'],
            contracts: [
              '@taquito/beacon-wallet',
              '@taquito/michelson-encoder',
              '@stablelib/ed25519',
              '@stablelib/nacl',
              '@stablelib/x25519-session',
              '@taquito/taquito',
            ],
            pdf: ['react-pdf', 'pdfjs-dist'],
            ui: [
              'classnames',
              'prop-types',
              'react',
              'react-router-dom',
              'react-dom',
              'framer-motion',
              'zustand',
            ],
          },
        },
      },
    },

    optimizeDeps: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      esbuildOptions: {},
    },
    resolve: {
      alias: {
        'readable-stream': 'vite-compatible-readable-stream',
        stream: 'vite-compatible-readable-stream',
        path: require.resolve('path-browserify'),
        util: 'rollup-plugin-node-polyfills/polyfills/util',
        ...teiaAliases,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,jsx}'],
    },
  }
})
