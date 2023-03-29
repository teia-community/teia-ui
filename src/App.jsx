import { Outlet, ScrollRestoration } from 'react-router-dom'
import useSettings from '@hooks/use-settings'
import { Loading as Preloading } from '@atoms/loading'
import { AnimatePresence } from 'framer-motion'
import { Debug } from '@atoms/debug'
import { Header } from '@components/header'
import useFool from '@hooks/use-fool'

const App = () => {
  const { isLoading } = useSettings()
  useFool()
  if (isLoading) {
    return <Preloading />
  }
  return (
    <>
      {process.env.NODE_ENV === 'development' && <Debug />}
      {/* <ScrollToTop /> */}
      <ScrollRestoration getKey={(location, matches) => location.key} />
      <AnimatePresence mode="wait" initial={false}>
        <Header key="header" />
        <Outlet />
      </AnimatePresence>
    </>
  )
}

export default App
