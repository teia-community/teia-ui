// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import React from 'react'
import { LocalSettingsProvider } from '@context'
import { ThemeSelection } from '@atoms/select'
import { MemoryRouter } from 'react-router'
import { IconCache } from '@utils/with-icon'

/**
 * these must be added to decorator array by end, for now
 * I'm simply using a theme one to add all teia's themes and a fake memory router
 */
export const decorators = {
  theme: (Story) => (
    <MemoryRouter initialEntries={['/']}>
      <IconCache.Provider value={{}}>
        <LocalSettingsProvider>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <ThemeSelection />
          </div>

          <div
            style={{
              margin: 0,
              padding: '2em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Story />
          </div>
        </LocalSettingsProvider>
      </IconCache.Provider>
    </MemoryRouter>
  ),
}
