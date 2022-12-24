import React from 'react'
import { Page, Container } from '@atoms/layout'
import styles from '@style'
import Markdown from 'markdown-to-jsx'
import raw from 'raw.macro'

const content = raw('../../lang/en/about.md')

export function About() {
  return (
    <Page title="about" large>
      <Container>
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
      </Container>
      {/*         <BottomBanner>
        Collecting has been temporarily disabled. Follow <a href="https://twitter.com/TeiaCommunity" target="_blank">@hicetnunc_art</a> or <a href="https://discord.gg/7pZrPCcgnG" target="_blank">join the discord</a> for updates.
        </BottomBanner> */}
    </Page>
  )
}
