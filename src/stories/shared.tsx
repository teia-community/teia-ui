// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import React from 'react'
import { MemoryRouter } from 'react-router'
import { IconCache } from '@utils/with-icon'
import { useEffect } from 'react'
import { useLocalSettings, type Theme } from '@context/localSettingsStore'
import { DecoratorFunction } from '@storybook/types'

interface ThemeProviderProps {
  theme: Theme
  children: React.ReactNode
}

const ThemeProvider = ({ theme, children }: ThemeProviderProps) => {
  const setTheme = useLocalSettings((st) => st.setTheme)

  useEffect(() => {
    if (theme) {
      setTheme(theme, true)
    }
  }, [theme, setTheme])

  return <>{children}</>
}

const MainDecorator = (Story, context) => (
  <MemoryRouter initialEntries={['/']}>
    <IconCache.Provider value={{}}>
      <ThemeProvider theme={context.globals.theme}>
        <div
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Story />
        </div>
      </ThemeProvider>
    </IconCache.Provider>
  </MemoryRouter>
)

/**
 * these must be added to decorator array by end, for now
 * I'm simply using a theme one to add all teia's themes and a fake memory router
 */
export const decorators: { [key: string]: DecoratorFunction } = {
  main: MainDecorator,
}
