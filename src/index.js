import { CollabsTab } from '@components/collab/show/CollabsTab'
import { Tags } from '@components/tags'
import { About } from '@pages/about'
import {
  CollabContractsOverview,
  CollabDisplay,
  Collaborate,
  CreateCollaboration,
} from '@pages/collaborate'
import { Settings } from '@pages/config/Settings'
import { Subjkt } from '@pages/config/Subjkt'
import { FAQ } from '@pages/faq'
import { Home } from '@pages/home'
import { Mint } from '@pages/mint'
import { ObjktDisplay } from '@pages/objkt-display'
import {
  Info,
  Burn,
  Collectors,
  History,
  Swap,
  Transfer,
} from '@pages/objkt-display/tabs'
import Display from '@pages/profile'
import Collections from '@pages/profile/collections'
import Creations from '@pages/profile/creations'
import Sync from '@pages/sync'
import { Terms } from '@pages/terms'
import React from 'react'
import ReactDOM from 'react-dom'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import './styles/index.scss'

const display_routes = (
  <>
    <Route index element={<Creations />} />
    <Route path="collection" element={<Collections />} />
    <Route path="collabs" element={<CollabsTab />} />
  </>
)

//TODO(mel): Check/Update site map / robot.txt
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/*" element={<App />}>
      <Route index element={<Home />} />
      <Route path="feed/*" element={<Home />} />
      <Route path="search/*" element={<Home isSearch />} />
      <Route path="tz/:address/*" element={<Display />}>
        {display_routes}
      </Route>

      <Route path=":id" element={<Display />}>
        {display_routes}
      </Route>
      <Route path="kt/:id" element={<CollabDisplay />} />
      <Route path="collab/:name" element={<CollabDisplay />} />
      <Route exact path="about" element={<About />} />
      <Route exact path="terms" element={<Terms />} />
      <Route exact path="faq" element={<FAQ />} />

      <Route path="sync" element={<Sync />} />
      <Route exact path="mint" element={<Mint />} />
      <Route path="collaborate" element={<Collaborate />}>
        <Route index element={<CollabContractsOverview />} />
        <Route path="create" element={<CreateCollaboration />} />
      </Route>
      <Route path="objkt/:id" element={<ObjktDisplay />}>
        <Route index element={<Info />} />
        <Route path="listings" element={<Collectors />} />
        <Route path="history" element={<History />} />
        <Route path="swap" element={<Swap />} />
        <Route path="burn" element={<Burn />} />
        <Route path="transfer" element={<Transfer />} />
      </Route>
      <Route exact path="subjkt" element={<Subjkt />} />
      <Route exact path="settings" element={<Settings />} />
      <Route path="tags/:tag" element={<Tags />} />
    </Route>
  )
)

ReactDOM.render(
  // <React.StrictMode>
  <RouterProvider router={router} />,
  // </React.StrictMode>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
