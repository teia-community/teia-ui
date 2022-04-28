import React from 'react'
import { Page, Container, Padding } from '@components/layout'
import { Routes, Route, NavLink } from 'react-router-dom'

import SalesFeed from './SalesFeed'
import NewObjktsFeed from './NewObjktsFeed'

import './style.css'
import { IconCache } from '@utils/with-icon'

function FilterLink({ children, to }) {
  return (
    <NavLink
      style={({ isActive }) =>
        isActive
          ? {
              textDecoration: 'underline',
            }
          : undefined
      }
      className="tag"
      to={to}
    >
      {children}
    </NavLink>
  )
}

export function Search() {
  return (
    <Page>
      <IconCache.Provider value={{}}>
        <Container>
          <Padding>
            <div style={{ marginTop: '15px' }}>
              <FilterLink to="/">recent sales</FilterLink>
              <FilterLink to="/newobjkts">new OBJKTs</FilterLink>
            </div>
          </Padding>
        </Container>
        <Container xlarge>
          <Routes>
            <Route path="/">
              <Route index element={<SalesFeed />} />
              <Route path="newobjkts" element={<NewObjktsFeed />} />
            </Route>
          </Routes>
        </Container>
      </IconCache.Provider>
    </Page>
  )
}
