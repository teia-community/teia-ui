import { get, join, kebabCase, uniq } from 'lodash'

export const defaultValues = {
  customLicenseData: {},
}

export const fields = [
  {
    label: 'Custom License',
    name: 'customLicenseData',
    enable_if: 'useCustomLicense',
    type: 'customCopyrightForm',
  },
]

const getFields = (deps) => {
  // return () => {
  const keys = Object.keys(deps)
  return fields
    .map((f) => {
      f.name = f.name || kebabCase(f.label)
      return f
    })
    .filter((f) => {
      if (f.enable_if && keys.includes(f.enable_if)) {
        return get(deps, f.enable_if)
      }

      return true
    })
}
// }

export default getFields
