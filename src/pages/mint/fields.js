import {
  LANGUAGES_OPTIONS,
  LICENSE_TYPES_OPTIONS,
  MAX_EDITIONS,
  MAX_ROYALTIES,
  MIN_ROYALTIES,
} from '@constants'
import { join, uniq } from 'lodash'

const fields = [
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
    label: 'Description',
    type: 'textarea',
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
      required: 'You need at least 1 editions',
      min: {
        value: 1,
        message: 'You need at least 1 editions',
      },
      max: {
        value: MAX_EDITIONS,
        message: `You can only mint ${MAX_EDITIONS} tokens at once.`,
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
    label: 'Language',
    placeholder: '(optional)',
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
    type: 'checkbox',
  },
  {
    label: 'Upload OBJKT',
    type: 'file',
  },
]

export default fields
