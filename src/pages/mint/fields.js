import {
  LANGUAGES_OPTIONS,
  LICENSE_TYPES_OPTIONS,
  MAX_EDITIONS,
  MAX_ROYALTIES,
  MIN_ROYALTIES,
} from '@constants'
import { get, join, kebabCase, uniq } from 'lodash'

export const defaultValues = {
  title: '',
  description: '',
  tags: '',
  editions: '',
  royalties: '',
  license: '',
  customLicenseData: {},
  language: '',
  nsfw: false,
  photosensitive: false,
  isTyped: false,
  artifact: null,
  cover: null,
}

export const fields = [
  {
    label: 'Title',
    type: 'text',
    placeholder: 'Max 500 characters (optional)',
    rules: {
      maxLength: {
        value: 500,
        message: 'Title must be 500 characters or less',
      },
    },
  },
  {
    label: 'This is a text mint',
    name: 'isTyped',
    type: 'checkbox',
    watch: true,
  },
  {
    label: 'Description',
    type: 'textarea',
    enable_if: 'showArtifact',
    placeholder: 'Max 5000 characters (optional)',
    rules: {
      value: 5000,
      message: 'Description must be 5000 characters or less',
    },
  },
  {
    label: 'Tags',
    type: 'text',
    placeholder: 'Comma separated. example: illustration, digital (optional)',
    rules: {
      setValueAs: (v) =>
        join(
          uniq(
            v
              .split(',')
              .map((tag) => tag.trim())
              .filter((n) => n)
          ),
          ','
        ),
    },
  },
  {
    label: 'Editions',
    type: 'number',
    placeholder: `No. editions, 1-${MAX_EDITIONS}`,
    rules: {
      required: 'You need at least 1 edition',
      min: {
        value: 1,
        message: 'You need at least 1 edition',
      },
      max: {
        value: MAX_EDITIONS,
        message: `You can only mint ${MAX_EDITIONS} editions at once.`,
      },
    },
  },
  {
    label: 'Royalties',
    type: 'number',
    placeholder: `After each sale (between ${MIN_ROYALTIES}-${MAX_ROYALTIES}%)`,
    rules: {
      required: `Royalties cannot be left empty, choose a value between ${MIN_ROYALTIES}% and ${MAX_ROYALTIES}%`,
      min: {
        value: MIN_ROYALTIES,
        message: `Royalties must be greater than ${MIN_ROYALTIES}%`,
      },
      max: {
        value: MAX_ROYALTIES,
        message: `Royalties must be less than ${MAX_ROYALTIES}%`,
      },
    },
  },
  {
    label: 'License',
    placeholder: '(optional)',
    type: 'select',
    alt: 'license selection',
    options: LICENSE_TYPES_OPTIONS,
  },
  {
    label: 'Custom License',
    name: 'customLicenseData',
    enable_if: 'useCustomLicense',
    type: 'customCopyrightForm',
  },
  {
    label: 'Language',
    placeholder: '(optional)',
    rules: {
      valueAs: (f) => f.value,
    },
    type: 'select-search',
    alt: 'token language',
    options: LANGUAGES_OPTIONS,
  },
  {
    label: 'NSFW',
    type: 'checkbox',
  },
  {
    label: 'Photo Sensitive Seizure Warning',
    name: 'photosensitive',
    type: 'checkbox',
  },
  {
    label: 'Monospace Font Required',
    name: 'isMonoType',
    type: 'checkbox',
    enable_if: 'isTyped',
    watch: true,
  },
  {
    label: 'Artifact',
    placeHolder: 'Upload OBJKT',
    name: 'artifact',
    type: 'file',
    watch: true,
    enable_if: 'showArtifact',
    rules: {
      required: 'You did not select a valid file',
    },
  },
  {
    label: 'Typed Art Input',
    name: 'typedinput',
    type: 'typed-textarea',
    watch: true,
    enable_if: 'isTyped',
    rules: {
      required: 'Typed art mints cannot be empty.',
    },
  },
  {
    label: 'Cover Image',
    placeHolder: 'Upload Cover image',
    name: 'cover',
    type: 'cover-file',
    watch: true,
    enable_if: 'needsCover',
    rules: {
      required: 'No cover provided',
    },
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
