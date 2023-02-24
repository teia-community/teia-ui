import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import styles from '@style'
import { Line } from '@atoms/line'

export const FAQ = () => {
  const Question = ({ text, link }) => {
    return (
      <li className={styles.buttons}>
        <Button href={link}>{text}</Button>
      </li>
    )
  }

  return (
    <Page title="faq" large>
      <div className={styles.faq__outer__container}>
        <h1 className={styles.faq__title}>FAQ</h1>
        <ul className={styles.faq__container}>
          <Question
            text="How do I get tezos/make a wallet?"
            link="https://github.com/teia-community/teia-docs/wiki/Getting-Started-with-Tezos"
          />
          <Question
            text="How do I mint?"
            link="https://github.com/teia-community/teia-docs/wiki/How-to-mint-%F0%9F%8C%BF"
          />
          <Question
            text="How do I edit my profile?"
            link="https://github.com/teia-community/teia-docs/wiki/Edit-your-profile"
          />
          <Question
            text="How do I add/change the price of my OBJKT?"
            link="https://github.com/teia-community/teia-docs/wiki/How-to-swap-%F0%9F%94%83"
          />
          <Question
            text="How do I burn my OBJKT?"
            link="https://github.com/teia-community/teia-docs/wiki/How-to-burn-%F0%9F%94%A5"
          />
          <Question
            text="How do I resell an OBJKT?"
            link="https://github.com/teia-community/teia-docs/wiki/How-to-resell-%F0%9F%8F%AA"
          />
        </ul>
      </div>

      <div className={styles.faq__outer__container}>
        <Line />
      </div>

      <div className={styles.faq__outer__container}>
        <ul className={styles.faq__container}>
          <Question
            text="General FAQ"
            link="https://github.com/teia-community/teia-docs/wiki/General-FAQs"
          />
          <Question
            text="Troubleshooting"
            link="https://github.com/teia-community/teia-docs/wiki/Troubleshooting"
          />
          <Question
            text="Useful tools"
            link="https://github.com/teia-community/teia-docs/wiki/Tools-made-by-the-community"
          />
          <Question
            text="User Safety"
            link="https://github.com/teia-community/teia-docs/wiki/User-safety"
          />
        </ul>
      </div>
    </Page>
  )
}
