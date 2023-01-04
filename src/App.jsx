import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import TeiaContextProvider from '@context/TeiaContext'
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
import { Friends } from './pages/friends'
import { Terms } from './pages/terms'
import { AnimatePresence } from 'framer-motion'
import { Debug } from '@atoms/debug'

const App = () => {
  const location = useLocation()
  const { isLoading } = useSettings()

  if (isLoading) {
    return <Preloading />
  }

  return (
    <TeiaContextProvider>
      <AnimatePresence>
        <Debug />
        <Routes location={location} key={location.pathname}>
          <Route path="/*" element={<Home />} />
          <Route path="/feed/*" element={<Home />} />
          <Route path="/search/*" element={<Home isSearch />} />
          <Route path="/friends/:address" element={<Friends />} />
          <Route path="/tz/:address/*" element={<Display />} />
          <Route path="/kt/:id" element={<CollabDisplay />} />
          <Route path="/collab/:name" element={<CollabDisplay />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/sync" element={<Sync />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/collaborate" element={<Collaborate />} />
          <Route path="/objkt/:id" element={<ObjktDisplay />} />
          <Route path="/config" element={<Config />} />
          <Route path="/tags/:tag" element={<Tags />} />
          <Route path="/:id/:collection?/*" element={<Display />} />
          <Route path="/:subjkt/*" element={<Display />} />
        </Routes>
      </AnimatePresence>
    </TeiaContextProvider>
  )
}

export default App
