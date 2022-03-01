import React, { Component } from 'react'
import { Page, Container, Padding } from '../../components/layout'
import { Button, Primary } from '../../components/button'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import styles from './styles.module.scss'

export class FAQ extends Component {
  static contextType = HicetnuncContext

  state = {
    reveal: false,
  }

  reveal = () => {
    this.setState({
      reveal: !this.state.reveal,
    })
  }

  render() {
    return (
      <Page title="faq" large>
        <Container>
          <Padding>
            <div className={styles.buttons}>
              <Button href="https://github.com/teia-community/teia-docs/wiki/Getting-Started-with-Tezos">
                <Primary>
                  <strong>how do I get tezos/make a wallet?</strong>
                </Primary>
              </Button>
            </div>
            <div className={styles.buttons}>
              <Button href="https://github.com/teia-community/teia-docs/wiki/How-to-mint-%F0%9F%8C%BF">
                <Primary>
                  <strong>how do I mint?</strong>
                </Primary>
              </Button>
            </div>
            <div className={styles.buttons}>
              <Button href="https://github.com/teia-community/teia-docs/wiki/Edit-your-profile">
                <Primary>
                  <strong>how do I edit my profile?</strong>
                </Primary>
              </Button>
            </div>
            <div className={styles.buttons}>
              <Button href="https://github.com/teia-community/teia-docs/wiki/How-to-swap-%F0%9F%94%83">
                <Primary>
                  <strong>how do I add/change the price of my OBJKT?</strong>
                </Primary>
              </Button>
            </div>
            <div className={styles.buttons}>
              <Button href="https://github.com/teia-community/teia-docs/wiki/How-to-burn-%F0%9F%94%A5">
                <Primary>
                  <strong>how do I burn my OBJKT?</strong>
                </Primary>
              </Button>
            </div>
            <div className={styles.buttons}>
              <Button href="https://github.com/teia-community/teia-docs/wiki/How-to-resell-%F0%9F%8F%AA">
                <Primary>
                  <strong>how do I resell an OBJKT?</strong>
                </Primary>
              </Button>
            </div>
            {/* <div className={styles.buttons}>
              <Button href="https://github.com/hicetnunc2000/hicetnunc/wiki/hDAO">
                <Primary>
                  <strong>what is hDAO ○?</strong>
                </Primary>
              </Button>
            </div> */}
          </Padding>
        </Container>
        <Container>
          <Padding>
            <div className={styles.buttons}>
              <Button href="https://github.com/teia-community/teia-docs/wiki/General">
                <Primary>
                  <strong>general faq</strong>
                </Primary>
              </Button>
            </div>
            <div className={styles.buttons}>
              <Button href="https://github.com/teia-community/teia-docs/wiki/Troubleshooting">
                <Primary>
                  <strong>troubleshooting</strong>
                </Primary>
              </Button>
            </div>
            <div className={styles.buttons}>
              <Button href="https://github.com/teia-community/teia-docs/wiki/Tools-made-by-the-community">
                <Primary>
                  <strong>useful tools</strong>
                </Primary>
              </Button>
            </div>
          </Padding>
        </Container>
        {/*         <Container>
          <Padding>
            <div className={styles.buttons}>
              <Button href="https://github.com/hicetnunc2000/hicetnunc/wiki/pt:Home">
                <Primary>
                  <strong>português</strong>
                </Primary>
              </Button>
            </div>
          </Padding>
        </Container> */}
      </Page>
    )
  }
}
