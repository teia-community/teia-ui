import React from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { TeiaProvider } from '@context'
import useSettings from '@hooks/use-settings'
import { Loading as Preloading } from '@atoms/loading'
import { AnimatePresence } from 'framer-motion'
import { Debug } from '@atoms/debug'
import { LocalSettingsProvider } from '@context'

const App = () => {
  const { isLoading } = useSettings()

  if (isLoading) {
    return <Preloading />
  }

  return (
    <TeiaProvider>
      <LocalSettingsProvider>
        <Debug />
        {/* <ScrollToTop /> */}
        <ScrollRestoration
          getKey={(location, matches) => {
            return location.key
          }}
        />
        <AnimatePresence exitBeforeEnter initial={false}>
          <Outlet />
        </AnimatePresence>
      </LocalSettingsProvider>
    </TeiaProvider>
  )
}

export default App
