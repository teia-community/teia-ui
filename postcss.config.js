const postcssPresetEnv = require('postcss-preset-env')
const fixFlex = require('postcss-flexbugs-fixes')
const cssnano = require('cssnano')
module.exports = {
  plugins: [
    cssnano({ preset: 'default' }),
    fixFlex(),
    postcssPresetEnv({
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
      features: {
        'nesting-rules': true,
      },
    }),
  ],
}
