import useClipboard from 'react-use-clipboard'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import Identicon from '@atoms/identicons'
import styles from '@style'
import { useDisplayStore } from '.'
import ParticipantList from '@components/collab/manage/ParticipantList'

export default function Profile({ user }) {
  const [isDiscordCopied, setDiscordCopied] = useClipboard(user.discord)
  const [isAddressCopied, setAddressCopied] = useClipboard(user.address, {
    successDuration: 2500,
  })

  const coreParticipants = useDisplayStore((st) => st.coreParticipants)

  return (
    <div className={styles.container}>
      <div className={styles.profile}>
        <div className={styles.user_pfp}>
          <Identicon
            className={styles.identicon}
            address={user.address}
            logo={user.identicon}
          />
        </div>
        <div className={styles.info}>
          <p className={styles.user}>{user.subjkt || user.alias}</p>

          {user.description && <p>{user.description}</p>}

          {coreParticipants && coreParticipants.length > 0 && (
            <ParticipantList title={false} participants={coreParticipants} />
          )}
          <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
            <Button href={`https://tzkt.io/${user.address}`}>
              {walletPreview(user.address)}
            </Button>
            <Button className={styles.square} onClick={setAddressCopied} />
            {isAddressCopied && 'Copied!'}
          </div>

          <div className={styles.socials}>
            {user.twitter && (
              <Button
                alt={`User profile on Twitter (@${user.twitter})`}
                href={`https://twitter.com/${user.twitter}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
                </svg>
              </Button>
            )}

            {user.tzprofile && (
              <Button
                alt="User profile on TzProfile"
                href={`https://tzprofiles.com/view/${user.tzprofile}`}
              >
                <svg
                  height="16"
                  viewBox="0 0 16 16"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <g>
                    <rect x="1" y="1" width="9" height="14" />
                    <rect x="1" y="1" width="14" height="9" />
                  </g>
                </svg>
              </Button>
            )}

            {user.discord && (
              <Button
                alt={`User profile on Discord, click to copy (${user.discord})`}
                onClick={setDiscordCopied}
              >
                <span
                  className={styles.top}
                  data-position={'top'}
                  data-tooltip={isDiscordCopied ? 'Copied' : user.discord} // TODO: add spaces logic
                  style={{
                    marginRight: '10px',
                  }}
                >
                  <svg
                    width="20"
                    height="15"
                    viewBox="0 0 20 15"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      fill: 'var(--text-color)',
                      stroke: 'transparent',
                    }}
                  >
                    <path d="M16.9308 1.24342C15.6561 0.667894 14.2892 0.243873 12.8599 0.00101874C12.8339 -0.00366827 12.8079 0.00804483 12.7945 0.0314716C12.6187 0.339138 12.4239 0.740513 12.2876 1.05599C10.7503 0.829542 9.22099 0.829542 7.71527 1.05599C7.57887 0.733501 7.37707 0.339138 7.20048 0.0314716C7.18707 0.00882646 7.16107 -0.00288664 7.13504 0.00101874C5.70659 0.243097 4.33963 0.667118 3.06411 1.24342C3.05307 1.2481 3.04361 1.25592 3.03732 1.26606C0.444493 5.07759 -0.265792 8.79544 0.0826501 12.4672C0.0842267 12.4852 0.0944749 12.5023 0.108665 12.5133C1.81934 13.7494 3.47642 14.4998 5.10273 14.9973C5.12876 15.0051 5.15634 14.9957 5.1729 14.9746C5.55761 14.4577 5.90054 13.9126 6.19456 13.3394C6.21192 13.3059 6.19535 13.266 6.15989 13.2528C5.61594 13.0497 5.098 12.8022 4.59977 12.5211C4.56037 12.4984 4.55721 12.443 4.59347 12.4164C4.69831 12.3391 4.80318 12.2587 4.9033 12.1775C4.92141 12.1626 4.94665 12.1595 4.96794 12.1689C8.24107 13.6393 11.7846 13.6393 15.0191 12.1689C15.0404 12.1587 15.0657 12.1619 15.0846 12.1767C15.1847 12.2579 15.2895 12.3391 15.3952 12.4164C15.4314 12.443 15.4291 12.4984 15.3897 12.5211C14.8914 12.8076 14.3735 13.0497 13.8288 13.252C13.7933 13.2653 13.7775 13.3059 13.7949 13.3394C14.0952 13.9118 14.4381 14.4569 14.8157 14.9738C14.8315 14.9957 14.8599 15.0051 14.8859 14.9973C16.5201 14.4998 18.1772 13.7494 19.8879 12.5133C19.9028 12.5023 19.9123 12.4859 19.9139 12.468C20.3309 8.22302 19.2154 4.53566 16.9568 1.26684C16.9513 1.25592 16.9419 1.2481 16.9308 1.24342ZM6.68335 10.2315C5.69792 10.2315 4.88594 9.34128 4.88594 8.24802C4.88594 7.15476 5.68217 6.26456 6.68335 6.26456C7.69239 6.26456 8.49651 7.16258 8.48073 8.24802C8.48073 9.34128 7.68451 10.2315 6.68335 10.2315ZM13.329 10.2315C12.3435 10.2315 11.5316 9.34128 11.5316 8.24802C11.5316 7.15476 12.3278 6.26456 13.329 6.26456C14.338 6.26456 15.1421 7.16258 15.1264 8.24802C15.1264 9.34128 14.338 10.2315 13.329 10.2315Z" />
                  </svg>
                </span>
              </Button>
            )}
            {user.github && (
              <Button
                alt={`User profile on Github (@${user.github})`}
                href={`https://github.com/${user.github}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </Button>
            )}
            {user.dns && (
              <Button
                alt={`User DNS Profile (${user.dns})`}
                href={`http://${user.dns}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
