import { CSSObjectWithLabel, StylesConfig, ThemeConfig } from 'react-select'

export const theme: ThemeConfig = (theme) => ({
  ...theme,
  colors: {
    ...theme.colors,
    text: 'var(--background-color)',
    primary: 'var(--text-color)',
  },
})

const common: CSSObjectWithLabel = {
  color: 'var(--text-color)',
}

export const style: StylesConfig = {
  option: (provided, { isSelected }) => ({
    ...provided,
    color: isSelected ? 'var(--background-color)' : 'var(--text-color)',
    backgroundColor: isSelected
      ? 'var(--text-color)'
      : 'var(--background-color)',
    '&:hover': {
      color: 'var(--background-color)',
      backgroundColor: 'var(--gray-60)',
    },
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    ...common,
    opacity: 0.6,
    '&:hover': {
      color: 'var(--text-color)',
      opacity: 0.8,
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--gray-60)',
  }),
  indicatorSeparator: (provided) => ({
    ...provided,

    backgroundColor: 'var(--gray-60)',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0px',
  }),
  input: (provided) => ({
    ...provided,
    ...common,
  }),
  control: (provided, { isFocused }) => ({
    ...provided,
    ...common,

    backgroundColor: 'var(--background-color)',
    border: 'none',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--background-color)',
    zIndex: 9999,
  }),
  menuList: (provided) => ({
    ...provided,
    '::-webkit-scrollbar': {
      width: '4px',
      height: '0px',
    },
    '::-webkit-scrollbar-track': {
      background: 'var(--gray-20)',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'var(--gray-60)',
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: 'var(--gray-80)',
    },
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),

  singleValue: (provided) => ({
    ...provided,
    ...common,
    overflow: 'visible',
  }),
}
