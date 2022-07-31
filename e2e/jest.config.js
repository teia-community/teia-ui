module.exports = {
  globals: {
    baseURL: 'http://localhost:3000',
  },
  testTimeout: 60000,
  testMatch: ['**/specs/*.js'],
  transform: {
    '\\.js$': 'react-scripts/config/jest/babelTransform',
  },
  verbose: true,
}
