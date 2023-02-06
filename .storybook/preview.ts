import '@styles/index.scss'
import { themes } from '@storybook/theming'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    theme: themes.dark,
  },
  // teia themes // keep for now
  // backgrounds: {
  //   values: [
  //     { name: 'light', value: '#ffffff' },
  //     { name: 'dark', value: '#111' },
  //     { name: 'aqua', value: '#6aadff' },
  //     { name: 'kawai', value: '#ffbde6' },
  //     { name: 'midnight', value: '#002633' },
  //     { name: 'coffee', value: '#170a06' },
  //   ],
  // },
}
