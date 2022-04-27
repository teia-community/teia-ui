import Sync from './pages/sync'
import { About } from './pages/about'
import { FAQ } from './pages/faq'
import Display from './pages/display'
import { Latest, Hdao, Random } from './pages/feeds'
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

export const routes = [
  {
    path: '/',
    component: Search,
  },
  {
    path: '/hdao',
    component: Hdao,
  },
  {
    path: '/random',
    component: Random,
  },
  {
    path: '/latest',
    component: Latest,
  },
  {
    path: '/friends/:id',
    component: Friends,
  },
  {
    path: '/tz/:id/:collection?',
    component: Display,
  },
  {
    path: '/kt/:id',
    component: CollabDisplay,
  },
  {
    path: '/collab/:name',
    component: CollabDisplay,
  },
  {
    path: '/about',
    component: About,
  },
  {
    path: '/terms',
    component: Terms,
  },
  {
    path: '/faq',
    component: FAQ,
  },
  {
    path: '/sync',
    component: Sync,
  },
  {
    path: '/mint',
    component: Mint,
  },
  {
    path: '/collaborate/:action?',
    component: Collaborate,
  },
  {
    path: '/objkt/:id',
    component: ObjktDisplay,
  },
  {
    path: '/galleries',
    component: Galleries,
  },
  {
    path: '/gallery/:id',
    component: GalleryDetail,
  },

  //
  //add condition for verifying if user is synced
  ///////////////
  {
    path: '/config',
    component: Config,
  },
  {
    path: '/search',
    component: Search,
  },
  {
    path: '/tags/:id',
    component: Tags,
  },
  {
    path: '/friends/:id',
    component: Friends,
  },
  {
    path: '/:id/:collection?',
    component: Display,
  },
]
