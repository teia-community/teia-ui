import type { CodegenConfig } from '@graphql-codegen/cli'

const plugins = [
  'typescript',
  'typescript-operations',
  // 'typed-document-node',
  'typescript-graphql-request',
  'plugin-typescript-swr',
]
const config = {
  skipTypename: false,
  withHooks: true,
  withHOC: false,
  withComponent: false,
  experimentalFragmentVariables: true,
  useTypeImports: true,
  commentDescriptions: true,
}
const codeGenConfig: CodegenConfig = {
  ignoreNoDocuments: true,
  overwrite: true,

  schema: 'https://indexer.tzprofiles.com/v1/graphql',
  generates: {
    './src/gql/index.ts': {
      documents: ['src/data/queries.ts'],
      schema: 'https://teztok.teia.rocks/v1/graphql',

      // preset: 'client',
      plugins,
      // schema: 'https://indexer.tzprofiles.com/v1/graphql', // this will get merged
      config,
    },
  },
}
export default codeGenConfig
