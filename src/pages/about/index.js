import React from 'react'
import { Page, Container, Padding } from '@components/layout'
import { Button, Primary } from '@components/button'
import useLanguage from '../../hooks/use-language'
import styles from './styles.module.scss'

export function About() {
  const { language } = useLanguage()

  return (
    <Page title="about" large>
      <Container>
        <Padding>
          <strong>teia is ...</strong>
        </Padding>
      </Container>

      <Container>
        <Padding>
          <p>... {language.about.paragraphs[0]}</p>
          <p>... {language.about.paragraphs[1]}</p>
          <p>... {language.about.paragraphs[2]}</p>
          <p>... {language.about.paragraphs[3]}</p>
        </Padding>
      </Container>
      <Container>
        <Padding>
          <p>{language.about.paragraphs[4]}</p>
        </Padding>
      </Container>

      <Container>
        <Padding>
          <div className={styles.buttons}>
            <Button href="https://github.com/teia-community/teia-docs/wiki/Core-Values-Code-of-Conduct-Terms-and-Conditions#1-core-values">
              <Primary>
                <strong>Core Value</strong>
              </Primary>
            </Button>
            &nbsp;<p>/</p>&nbsp;
            <Button href="https://github.com/teia-community/teia-docs/wiki/Core-Values-Code-of-Conduct-Terms-and-Conditions#2-code-of-conduct">
              <Primary>
                <strong>Code of Conduct</strong>
              </Primary>
            </Button>
            &nbsp;<p>/</p>&nbsp;
            <Button href="https://github.com/teia-community/teia-docs/wiki/Core-Values-Code-of-Conduct-Terms-and-Conditions#3-terms-and-conditions---account-restrictions">
              <Primary>
                <strong>Terms and Conditions</strong>
              </Primary>
            </Button>
          </div>
        </Padding>
      </Container>

      <Container>
        <Padding>
          <div className={styles.buttons}>
            <p>Find current news on our</p>
            &nbsp;
            <Button href="https://blog.teia.art">
              <Primary>
                <strong>blog</strong>
              </Primary>
            </Button>
            <p>, follow us on</p>&nbsp;
            <Button href="https://twitter.com/TeiaCommunity">
              <Primary>
                <strong>twitter</strong>
              </Primary>
            </Button>
            <p>, join the community on </p>&nbsp;
            <Button href="https://discord.gg/7pZrPCcgnG">
              <Primary>
                <strong>discord</strong>
              </Primary>
            </Button>
          </div>
        </Padding>
      </Container>

      <Container>
        <Padding>
          <div className={styles.buttons}>
            <p>WIKI is available on</p>&nbsp;
            <Button href="https://github.com/teia-community/teia-docs/wiki">
              <Primary>
                <strong>github</strong>
              </Primary>
            </Button>
          </div>
        </Padding>
      </Container>
      <Container>
        <Padding>
          <Button href="https://github.com/teia-community/teia-docs/wiki/Tools-made-by-the-community">
            <Primary>
              <strong>Community tools</strong>
            </Primary>
          </Button>
          {false && (
            <Button href="https://projects.stroep.nl/hicetnunc">
              <Primary>
                <strong>example tool2</strong>
              </Primary>
            </Button>
          )}
        </Padding>
      </Container>

      <Container>
        <Padding>
          <div className={styles.buttons}>
            <p>Report</p>&nbsp;
            <Button href="https://github.com/teia-community/teia-ui/issues">
              <Primary>
                <strong>issues</strong>
              </Primary>
            </Button>
          </div>
        </Padding>
      </Container>
      {/*         <BottomBanner>
      Collecting has been temporarily disabled. Follow <a href="https://twitter.com/TeiaCommunity" target="_blank">@hicetnunc_art</a> or <a href="https://discord.gg/7pZrPCcgnG" target="_blank">join the discord</a> for updates.
      </BottomBanner> */}
    </Page>
  )
}
