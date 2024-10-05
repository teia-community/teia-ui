import useClipboard from 'react-use-clipboard'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import Identicon from '@atoms/identicons'
import { useDaoTokenBalance } from '@data/swr'
import styles from '@style'
import { useDisplayStore } from '.'
import ParticipantList from '@components/collab/manage/ParticipantList'
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

async function reverseRecord(address) {
  const result = await axios.post(
    `${import.meta.env.VITE_TEZOSDOMAINS_GRAPHQL_API}`,
    {
      query: `query reverseRecord($address: String!) { reverseRecord(address: $address) { domain { name }}}`,
      variables: { address },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  return result?.data?.data?.reverseRecord?.domain?.name || ''
}

export default function Profile({ user }) {
  const [isDiscordCopied, setDiscordCopied] = useClipboard(user.discord)
  const [isAddressCopied, setAddressCopied] = useClipboard(user.address, {
    successDuration: 2500,
  })
  const [daoTokenBalance] = useDaoTokenBalance(user.address)

  const coreParticipants = useDisplayStore((st) => st.coreParticipants)
  const [reverseDomain, setReverseDomain] = useState('')

  const loadReverseDomain = useCallback(() => {
    reverseRecord(user.address).then((domain) => {
      setReverseDomain(domain)
    })
  }, [user.address])

  useEffect(() => {
    loadReverseDomain()
  }, [loadReverseDomain])

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
              {reverseDomain ? reverseDomain : walletPreview(user.address)}
            </Button>
            <Button className={styles.square} onClick={setAddressCopied} />
            {isAddressCopied && 'Copied!'}
          </div>

          {daoTokenBalance >= 0 && (
            <p>
              {Math.round(daoTokenBalance * 10) / 10} <a href="dao">TEIA</a>
            </p>
          )}

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
                      marginRight: '10px',
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

            {user.gitlab && (
              <Button
                alt={`User profile on gitlab (@${user.gitlab})`}
                href={`https://gitlab.com/${user.gitlab}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="m21.94 13.11-1.05-3.22c0-.03-.01-.06-.02-.09l-2.11-6.48a.859.859 0 0 0-.8-.57c-.36 0-.68.25-.79.58l-2 6.17H8.84L6.83 3.33a.851.851 0 0 0-.79-.58c-.37 0-.69.25-.8.58L3.13 9.82v.01l-1.07 3.28c-.16.5.01 1.04.44 1.34l9.22 6.71c.17.12.39.12.56-.01l9.22-6.7c.43-.3.6-.84.44-1.34M8.15 10.45l2.57 7.91-6.17-7.91m8.73 7.92 2.47-7.59.1-.33h3.61l-5.59 7.16m4.1-13.67 1.81 5.56h-3.62m-1.3.95-1.79 5.51L12 19.24l-2.86-8.79M6.03 3.94 7.84 9.5H4.23m-1.18 4.19c-.09-.07-.13-.19-.09-.29l.79-2.43 5.82 7.45m11.38-4.73-6.51 4.73.02-.03 5.79-7.42.79 2.43c.04.1 0 .22-.09.29" />
                </svg>
              </Button>
            )}

            {user.site && (
              <Button alt={`User web site ${user.site}`} href={`${user.site}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2 0-.68.06-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2M12 19.96c-.83-1.2-1.5-2.53-1.91-3.96h3.82c-.41 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.923 7.923 0 0 1 9.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8.008 8.008 0 0 1 5.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2M12 4.03c.83 1.2 1.5 2.54 1.91 3.97h-3.82c.41-1.43 1.08-2.77 1.91-3.97M18.92 8h-2.95a15.65 15.65 0 0 0-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2Z" />
                </svg>
              </Button>
            )}

            {user.email && (
              <Button
                alt={`User email address ${user.email}`}
                href={`mailto: ${user.email}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 -2.5 20 20"
                  fill="currentColor"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="m18 2.291-8 7.027-8-7.037V2h16v.291ZM2 13V4.945l8 7.035 8-7.027V13H2Zm-2 2h20V0H0v15Z" />
                </svg>
              </Button>
            )}

            {user.reddit && (
              <Button
                alt={`User reddit account (${user.reddit})`}
                href={`https://www.reddit.com/${user.reddit}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 279.748 279.748"
                  fill="currentColor"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="M279.748 133.142c0-19.299-15.701-35-35-35-10.768 0-20.674 4.812-27.279 13.064-18.532-8.431-39.663-13.626-62.015-15.271l19.206-60.692 42.895 9.294c3.285 12.782 14.901 22.258 28.693 22.258 16.336 0 29.627-13.29 29.627-29.626 0-16.336-13.291-29.627-29.627-29.627-11.801 0-21.999 6.941-26.759 16.95l-49.497-10.725a10.002 10.002 0 0 0-11.651 6.756L134.636 95.43c-26.164.638-50.988 6.053-72.356 15.775-6.606-8.251-16.512-13.063-27.28-13.063-19.299 0-35 15.701-35 35 0 9.373 3.683 18.173 10.222 24.709-3.9 8.37-5.875 17.076-5.875 25.936 0 24.048 14.396 46.492 40.538 63.199 25.447 16.264 59.183 25.221 94.989 25.221 35.808 0 69.542-8.957 94.989-25.221 26.142-16.707 40.538-39.151 40.538-63.199 0-8.859-1.975-17.565-5.875-25.936 6.539-6.537 10.222-15.336 10.222-24.709zM15.369 145.139c-2.212-3.59-3.369-7.688-3.369-11.997 0-12.682 10.317-23 23-23 5.444 0 10.558 1.851 14.649 5.258-14.622 8.302-26.132 18.289-34.28 29.739zm52.671 20.266c0-13.785 11.215-25 25-25s25 11.215 25 25-11.215 25-25 25-25-11.215-25-25zm123.119 57.054c-9.745 10.637-29.396 17.244-51.285 17.244-21.888 0-41.539-6.607-51.284-17.244a9.937 9.937 0 0 1-2.617-7.192 9.933 9.933 0 0 1 3.235-6.937 9.974 9.974 0 0 1 6.754-2.627c2.797 0 5.484 1.183 7.373 3.244 5.803 6.333 20.827 10.756 36.539 10.756s30.737-4.423 36.539-10.756a10.022 10.022 0 0 1 7.374-3.244c2.508 0 4.906.933 6.755 2.627a9.928 9.928 0 0 1 3.234 6.937 9.933 9.933 0 0 1-2.617 7.192zm-4.451-32.054c-13.785 0-25-11.215-25-25s11.215-25 25-25 25 11.215 25 25-11.215 25-25 25zm77.671-45.266c-8.147-11.45-19.657-21.436-34.28-29.739 4.092-3.408 9.205-5.258 14.649-5.258 12.683 0 23 10.318 23 23 0 4.309-1.157 8.407-3.369 11.997z" />{' '}
                </svg>
              </Button>
            )}

            {user.mailchain && (
              <Button
                alt={`User mailchain address (${user.mailchain})`}
                href={`https://app.mailchain.com/mailto:${user.mailchain}@tezos.mailchain.com`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="M7.879 6.894a.985.985 0 0 0-.984.985v8.242c0 .543.44.984.984.984h8.242a.985.985 0 0 0 .984-.984V7.88a.985.985 0 0 0-.984-.985zM16.12 18.65H7.88a2.529 2.529 0 0 1-2.527-2.528V7.88a2.529 2.529 0 0 1 2.527-2.527h8.242a2.529 2.529 0 0 1 2.527 2.527v8.242a2.529 2.529 0 0 1-2.527 2.528zm.125-15.106a.878.878 0 0 0-.621.258l-1.7 1.7a.878.878 0 0 0 0 1.246l3.329 3.328a.878.878 0 0 0 1.246 0l1.7-1.7a.878.878 0 0 0 0-1.246L16.87 3.801a.887.887 0 0 0-.625-.258Zm1.633 8.332a2.424 2.424 0 0 1-1.715-.707l-3.332-3.332a2.407 2.407 0 0 1-.707-1.714c0-.649.25-1.258.707-1.715l1.7-1.7a2.407 2.407 0 0 1 1.714-.706c.649 0 1.258.25 1.715.707l3.332 3.332c.457.457.707 1.066.707 1.714 0 .649-.25 1.258-.707 1.715l-1.7 1.7a2.424 2.424 0 0 1-1.714.706zM7.754 3.543a.887.887 0 0 0-.625.258L3.8 7.13a.878.878 0 0 0 0 1.246l1.699 1.7a.878.878 0 0 0 1.246 0l3.328-3.328a.882.882 0 0 0 0-1.246L8.375 3.8a.878.878 0 0 0-.621-.258ZM6.12 11.876c-.648 0-1.258-.25-1.715-.707L2.707 9.47A2.407 2.407 0 0 1 2 7.754c0-.648.25-1.257.707-1.714L6.04 2.708A2.407 2.407 0 0 1 7.754 2c.648 0 1.258.25 1.715.707l1.699 1.699a2.428 2.428 0 0 1 0 3.43l-3.332 3.332a2.407 2.407 0 0 1-1.715.707Zm0 1.794a.878.878 0 0 0-.621.257l-1.7 1.7a.878.878 0 0 0 0 1.246L7.13 20.2a.878.878 0 0 0 1.246 0l1.7-1.7a.878.878 0 0 0 0-1.246l-3.329-3.328a.887.887 0 0 0-.625-.258ZM7.754 22a2.424 2.424 0 0 1-1.715-.708l-3.332-3.332A2.407 2.407 0 0 1 2 16.247c0-.649.25-1.258.707-1.715l1.7-1.7a2.407 2.407 0 0 1 1.714-.706c.649 0 1.258.25 1.715.707l3.332 3.332a2.4 2.4 0 0 1 .707 1.714c0 .649-.25 1.258-.707 1.715l-1.7 1.7A2.424 2.424 0 0 1 7.755 22Zm10.125-8.332a.88.88 0 0 0-.625.257l-3.328 3.328a.882.882 0 0 0 0 1.247l1.699 1.699a.878.878 0 0 0 1.246 0l3.328-3.328a.878.878 0 0 0 0-1.246l-1.699-1.7a.878.878 0 0 0-.621-.257ZM16.246 22a2.424 2.424 0 0 1-1.715-.708l-1.699-1.699a2.428 2.428 0 0 1 0-3.43l3.332-3.331a2.4 2.4 0 0 1 1.715-.707c.648 0 1.258.25 1.715.707l1.695 1.699c.457.457.71 1.066.71 1.715 0 .648-.253 1.257-.706 1.714l-3.332 3.332a2.424 2.424 0 0 1-1.715.707z" />
                </svg>
              </Button>
            )}

            {user.telegram && (
              <Button
                alt={`User telegram account (${user.telegram})`}
                href={`https://t.me/${user.telegram}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="m9.78 18.65.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42Z" />
                </svg>
              </Button>
            )}

            {user.facebook && (
              <Button
                alt={`User facebook account (${user.facebook})`}
                href={`https://www.facebook.com/${user.facebook}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z" />
                </svg>
              </Button>
            )}

            {user.instagram && (
              <Button
                alt={`User instagram account (${user.instagram})`}
                href={`https://www.instagram.com/${user.instagram}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    fill: 'var(--text-color)',
                    stroke: 'transparent',
                    marginRight: '10px',
                  }}
                >
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
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
