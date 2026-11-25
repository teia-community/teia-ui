import { useLayoutEffect, useRef } from 'react'
import { Page } from '@atoms/layout'
import Tour, { TourLink } from '@components/tour'
import styles from '@style'
import aboutStyles from './index.module.scss'
import { ReactComponent as AboutMD } from '../../lang/en/about.md'

const ABOUT_TOUR = [
  {
    target: 'about-intro',
    text: 'What Teia is: a non-profit, open-source art platform on Tezos, owned and run by its community.',
  },
  {
    target: 'about-rules',
    text: 'The core values, code of conduct, terms and moderation rules everyone on Teia agrees to.',
  },
  {
    target: 'about-links',
    text: 'Where to find the docs, blog, Discord and announcements, and how to report scams, harassment or bugs.',
  },
  {
    target: 'about-imprint',
    text: 'The legal entity behind Teia, Teia DAO LLC, and how to reach it.',
  },
  {
    target: 'about-tech',
    text: 'Teia is a community fork of hic et nunc. Marketplace fees are 2.5%.',
  },
  {
    target: 'about-contracts',
    text: 'The smart contracts Teia runs on. Click one to inspect it on a block explorer.',
  },
]

// The page is rendered markdown, so tour targets are tagged by heading text.
const HEADING_TARGETS = {
  'Teia is': 'about-intro',
  Links: 'about-links',
  Imprint: 'about-imprint',
  'Tech Specs': 'about-tech',
  'Smart Contracts:': 'about-contracts',
}

export function About() {
  const ref = useRef(null)

  // Layout effect: tag targets before the Tour's own effect looks for them.
  useLayoutEffect(() => {
    ref.current.querySelectorAll('h1, h2').forEach((h) => {
      const target = HEADING_TARGETS[h.textContent.trim()]
      if (target) h.dataset.tour = target
    })
    ref.current
      .querySelector('a[href$="#core-values"]')
      ?.closest('p')
      ?.setAttribute('data-tour', 'about-rules')
  }, [])

  return (
    <Page title="about">
      <Tour name="about" steps={ABOUT_TOUR} />
      <h1 className={aboutStyles.headline}>
        About <TourLink name="about" title="How this page works" />
      </h1>
      <div className={styles.about} ref={ref}>
        <AboutMD />
      </div>
    </Page>
  )
}
