import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { TeiaProvider } from '@context'
import useSettings from '@hooks/use-settings'
import { Loading as Preloading } from '@atoms/loading'
import Sync from './pages/sync'
import { About } from './pages/about'
import { FAQ } from './pages/faq'
import Display from './pages/profile'
import { Mint } from './pages/mint'
import { ObjktDisplay } from './pages/objkt-display'
import { Collaborate, CollabDisplay } from './pages/collaborate'
import { Config } from './pages/config'
import { Home } from './pages/home'
import { Tags } from './pages/tags'
import { Terms } from './pages/terms'
import { AnimatePresence } from 'framer-motion'
import { Debug } from '@atoms/debug'
import { LocalSettingsProvider } from '@context'

const App = () => {
  const location = useLocation()
  const { isLoading } = useSettings()

  if (isLoading) {
    return <Preloading />
  }

  return (
    <TeiaProvider>
      <LocalSettingsProvider>
        <Debug />
        <AnimatePresence exitBeforeEnter initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route exact path="/" element={<Home />} />
            <Route path="/feed/*" element={<Home />} />
            <Route path="/search/*" element={<Home isSearch />} />
            <Route path="/tz/:address/*" element={<Display />} />
            <Route path="/kt/:id" element={<CollabDisplay />} />
            <Route path="/collab/:name" element={<CollabDisplay />} />
            <Route exact path="/about" element={<About />} />
            <Route exact path="/terms" element={<Terms />} />
            <Route exact path="/faq" element={<FAQ />} />
            <Route path="/sync" element={<Sync />} />
            <Route exact path="/mint" element={<Mint />} />
            <Route path="/collaborate" element={<Collaborate />} />
            <Route path="/objkt/:id" element={<ObjktDisplay />} />
            <Route exact path="/config" element={<Config />} />
            <Route path="/tags/:tag" element={<Tags />} />
            <Route path="/:id/*" element={<Display />} />
          </Routes>
        </AnimatePresence>
      </LocalSettingsProvider>
    </TeiaProvider>
  )
}

export default App
