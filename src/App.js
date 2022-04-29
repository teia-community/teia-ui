import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HicetnuncContextProvider from '@context/HicetnuncContext'
import useSettings from '@hooks/use-settings'
import { Loading as Preloading } from '@components/loading'
import Sync from './pages/sync'
import { About } from './pages/about'
import { FAQ } from './pages/faq'
import Display from './pages/display'
import { Mint } from './pages/mint'
import { ObjktDisplay } from './pages/objkt-display'
import { Collaborate, CollabDisplay } from './pages/collaborate'
import { Galleries } from './pages/galleries'
import { GalleryDetail } from './pages/gallery-detail'
import { Config } from './pages/config'
import { Search } from './pages/search'
import { Tags } from './pages/tags'
import { Friends } from './pages/friends'
import { Terms } from './pages/terms'

const App = () => {
  const { isLoading } = useSettings()

  if (isLoading) {
    return <Preloading />
  }

  return (
    <HicetnuncContextProvider>
      <Routes>
        <Route path="/*" element={<Search />} />

        <Route path="/friends/:id" element={<Friends />} />
        <Route path="/tz/:id/:collection?" element={<Display />} />
        <Route path="/kt/:id" element={<CollabDisplay />} />
        <Route path="/collab/:name" element={<CollabDisplay />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/sync" element={<Sync />} />
        <Route path="/mint" element={<Mint />} />
        <Route path="/collaborate/:action?" element={<Collaborate />} />
        <Route path="/objkt/:id" element={<ObjktDisplay />} />
        <Route path="/galleries" element={<Galleries />} />
        <Route path="/gallery/:id" element={<GalleryDetail />} />
        <Route path="/config" element={<Config />} />
        <Route path="/tags/:id" element={<Tags />} />
        <Route path="/:id/:collection?" element={<Display />} />
      </Routes>
    </HicetnuncContextProvider>
  )
}

export default App
