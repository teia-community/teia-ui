/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect } from 'react'
import { useHistory } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { Footer } from '../footer'
import { Container, Padding } from '../layout'
import { Button, Primary } from '../button'
import { Status } from '../status'
import { fadeIn } from '../../utils/motion'
import { Menu } from '../icons'
import { walletPreview } from '../../utils/string'
import { VisuallyHidden } from '../visually-hidden'
import styles from './styles.module.scss'
import { getItem, setItem } from '../../utils/storage'
/* import { BeaconWallet } from '@taquito/beacon-wallet'

const wallet = new BeaconWallet({
  name: 'hicetnunc.xyz',
  preferredNetwork: 'mainnet',
}) */

export const Header = () => {
  const history = useHistory()
  const context = useContext(HicetnuncContext)
  useEffect(() => {
    context.setAccount()
    context.setTheme(getItem('theme') || setItem('theme', 'dark'))
    context.setLogo()
  }, [])

  // we assume user isn't connected
  let button = 'Sync'

  // but if they are
  if (context.acc?.address) {
    // is menu closed?
    if (context.collapsed) {
      const proxyAddress = context.proxyAddress ? ` (${context.proxyName || walletPreview(context.proxyAddress)})` : ''
      button = walletPreview(context.acc.address) + proxyAddress
    } else {
      // menu is open
      button = 'Unsync'
    }
  }

  //const activeAccount = await wallet.client.getActiveAccount()
  //console.log(activeAccount)
  const handleRoute = (path, data) => {
    context.setMenu(true)
    history.push(path, data)
  }


  const handleSyncUnsync = () => {
    if (context.acc?.address && !context.collapsed) {
      // disconnect wallet
      context.disconnect()
    } else {
      // connect wallet
      context.syncTaquito()
    }
  }

  return (
    <>
      <header className={styles.container}>
        <div className={styles.content}>
          <Button onClick={() => handleRoute('/')}>
            <div className={styles.logo}>
              {/* HIC LOGO */}
              {true && (
                <img src={`https://teia.art/logos/${context.theme}/${context.logo}`} alt="teia"></img>
              )}
              {/* PRIDE LOGO */}
              {false && <img src="/hen-pride.gif" alt="pride 2021" />}
            </div>
          </Button>

          <div className={styles.right}>
            {!context.collapsed && context.proxyAddress && (
              <div className={styles.mr}>
                <Button onClick={() => context.setProxyAddress(null)} secondary>
                  <Primary>Exit collab</Primary>
                </Button>
              </div>
            )}

            <Button onClick={handleSyncUnsync} secondary>
              <Primary>{button}</Primary> {/* Main address display here */}
            </Button>
            <Status/>
            <Button onClick={context.toogleNavbar} secondary>
              <VisuallyHidden>
                {`${context.collapsed ? 'show' : 'hide'} menu`}
              </VisuallyHidden>
              <Menu isOpen={!context.collapsed} />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {!context.collapsed && (
          <motion.div className={styles.menu} {...fadeIn()}>
            <Container>
              <Padding>
                <nav className={styles.content}>
                  <ul style={{ borderRight: '1px solid var(--border-color)' }}>
                    <li>
                      <Button onClick={() => handleRoute('/search')}>
                        <Primary>Search</Primary>
                      </Button>
                    </li>
                    <li>
                      <Button>
                        <Primary><a className={styles.link} href='/galleries'>Galleries</a></Primary>
                      </Button>
                    </li>
                    <li>
                      <Button onClick={() => handleRoute('/collaborate')}>
                        <Primary>Collaborate</Primary>
                      </Button>
                    </li>
                    <li>
                      <Button onClick={() => handleRoute('/about')}>
                        <Primary>About</Primary>
                      </Button>
                    </li>
                    <li>
                      <Button className={styles.link} onClick={() => handleRoute('/faq')}>
                        <Primary>F.A.Q</Primary>
                      </Button>
                    </li>
                  </ul>
                  {context.acc?.address ?
                    <ul>
                      <div className={styles.address}>
                        {walletPreview(context.acc.address)}
                      </div>
                      <li style={{ textAlign: 'left' }}>
                        <Button onClick={() => handleRoute('/mint')}>
                          <Primary left>
                            Mint OBJKT
                          </Primary>
                        </Button>
                      </li>
                      <li style={{ textAlign: 'left' }}>
                        <Button onClick={() => handleRoute('/sync', 'tz')}>
                          <Primary left>Manage assets</Primary>
                        </Button>
                      </li>
                      <li style={{ textAlign: 'left' }}>
                        <Button onClick={() => handleRoute('/sync', 'friends')}>
                          <Primary>Friends</Primary>
                        </Button>
                      </li>
                      <li style={{ textAlign: 'left' }}>
                        <Button onClick={() => handleRoute('/config')}>
                          <Primary left>Profile</Primary>
                        </Button>
                      </li>
                    </ul>
                     :
                     <ul>
                        <div className={styles.no__address__text}>The present decentralized application allows its users to manage decentralized digital assets, serving as a public smart contract infrastructure on Tezos Blockchain.</div>
                     </ul>
                    }
                </nav>
              </Padding>
            </Container>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
