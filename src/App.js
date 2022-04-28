import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HicetnuncContextProvider from '@context/HicetnuncContext'
import useSettings from '@hooks/use-settings'
import { Loading as Preloading } from '@components/loading'
import { routes } from './routes'

const App = () => {
  const { isLoading } = useSettings()

  if (isLoading) {
    return <Preloading />
  }

  return (
    <HicetnuncContextProvider>
      <Routes>
        {routes.map(({ path, component: Comp }) => (
          <Route path={path} key={path} element={<Comp />} />
        ))}
      </Routes>
    </HicetnuncContextProvider>
  )
}

export default App
