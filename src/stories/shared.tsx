// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import React from 'react'
import { LocalSettingsProvider } from '@context'
import { MemoryRouter } from 'react-router'
import { IconCache } from '@utils/with-icon'
import useLocalSettings from '@hooks/use-local-settings'
import { useEffect } from 'react'

const ThemeProvider = ({ theme, children }) => {
  const { setTheme } = useLocalSettings()

  useEffect(() => {
    setTheme(theme)
  }, [setTheme, theme])

  return <>{children}</>
}

/**
 * these must be added to decorator array by end, for now
 * I'm simply using a theme one to add all teia's themes and a fake memory router
 */
export const decorators = {
  main: (Story, context) => (
    <MemoryRouter initialEntries={['/']}>
      <IconCache.Provider value={{}}>
        <LocalSettingsProvider>
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
        </LocalSettingsProvider>
      </IconCache.Provider>
    </MemoryRouter>
  ),
}
