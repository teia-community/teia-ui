import React, { Component } from 'react'
import { Page, Container, Padding } from '@components/layout'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { getLanguage } from '@constants'
import styles from './styles.module.scss'
import Markdown from 'markdown-to-jsx'
import raw from 'raw.macro'

const content = raw('../../lang/en/about.md')

export class About extends Component {
  static contextType = HicetnuncContext

  language = getLanguage()

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
      <Page title="about" large>
        <Container>
          <Padding>
            <Markdown
              options={{
                overrides: {
                  hr: {
                    props: {
                      className: styles.spacer,
                    },
                  },
                },
              }}
              className={styles.about}
            >
              {content}
            </Markdown>
          </Padding>
        </Container>
        {/*         <BottomBanner>
        Collecting has been temporarily disabled. Follow <a href="https://twitter.com/TeiaCommunity" target="_blank">@hicetnunc_art</a> or <a href="https://discord.gg/7pZrPCcgnG" target="_blank">join the discord</a> for updates.
        </BottomBanner> */}
      </Page>
    )
  }
}
