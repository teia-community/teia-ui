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

export const style: StylesConfig<any, boolean> = {
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
  }) as any,
  dropdownIndicator: (provided) => ({
    ...provided,
    ...common,
    opacity: 0.6,
    '&:hover': {
      color: 'var(--text-color)',
      opacity: 0.8,
    },
  }) as any,
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--gray-60)',
  }) as any,
  indicatorSeparator: (provided) => ({
    ...provided,

    backgroundColor: 'var(--gray-60)',
  }) as any,
  valueContainer: (provided) => ({
    ...provided,
    padding: '0px',
  }) as any,
  input: (provided) => ({
    ...provided,
    ...common,
  }) as any,
  control: (provided, { isFocused }) => ({
    ...provided,
    ...common,

    backgroundColor: 'var(--background-color)',
    border: 'none',
  }) as any,
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--background-color)',
    zIndex: 9999,
  }) as any,
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
  }) as any,
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }) as any,

  singleValue: (provided) => ({
    ...provided,
    ...common,
    overflow: 'visible',
  }) as any,
}
