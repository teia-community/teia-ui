import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import HicetnuncContextProvider from '@context/HicetnuncContext'
import { getInitialData } from '@data/api'
import { Header } from '@components/header'
import { Loading as Preloading } from '@components/loading'
import { FeedbackComponent } from '@components/feedback'
import { routes } from './routes'

const App = () => {
  const [loading, setLoading] = useState(true)

  // 1st time loading the site ???
  useEffect(() => {
    getInitialData().then(() => {
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <Preloading />
  }

  return (
    <HicetnuncContextProvider>
      <Header />
      <FeedbackComponent />
      <Routes>
        {routes.map(({ path, component: Comp }) => (
          <Route path={path} key={path} element={<Comp />} />
        ))}
      </Routes>
    </HicetnuncContextProvider>
  )
}

export default App
