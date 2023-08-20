import { useState } from 'react'
import { Page } from '@atoms/layout'
import { useUserStore } from '@context/userStore'
import { Button } from '@atoms/button'
import { Checkbox } from '@atoms/input'
import { Line } from '@atoms/line'
import styles from '@style'
//TODO: Add a default md style to extend upon, and probably use remarkGfm plugin
import { ReactComponent as DaoMD } from '../../lang/en/DAO_claim.md'

export const DAO = () => {
  const claimTokens = useUserStore((st) => st.claimTokens)
  const [acceptLegalDisclaimer, setAcceptLegalDisclaimer] = useState(false)

  return (
    <Page title="Claim DAO tokens" large>
      <div className={styles.container}>
        <DaoMD />

        <>
          <Line style={{ paddingBottom: '2em' }} />
          <section className={styles.buttons_row}>
            <div
              style={{
                paddingBottom: '2em',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Checkbox
                alt={`click to ${
                  acceptLegalDisclaimer ? 'decline' : 'accept'
                } the legal disclaimer`}
                checked={acceptLegalDisclaimer}
                onCheck={setAcceptLegalDisclaimer}
                label={
                  'I have read and understood the legal disclaimer and agree to it'
                }
              />
            </div>

            <Button
              disabled={!acceptLegalDisclaimer}
              shadow_box
              onClick={claimTokens}
            >
              Claim TEIA DAO tokens
            </Button>
            {!acceptLegalDisclaimer && (
              <span style={{ color: 'red' }}>
                <p>
                  {' '}
                  You need to agree to the legal disclaimer with the checkbox
                  above in order to access the token claim button.
                </p>
              </span>
            )}
            {acceptLegalDisclaimer}
          </section>
        </>
      </div>
    </Page>
  )
}
