import { isRouteErrorResponse, useRouteError } from 'react-router'
import styles from '@style'
import { Page } from '@atoms/layout'
import Button from '@atoms/button/Button'
import { get } from 'lodash'

const status_to_string = {
  404: "This page doesn't exist!",
  401: "You aren't authorized to see this",
  503: 'Looks like our API is down',
  418: '🫖',
  default: 'Something went wrong',

  // default:'SUBJKT Error, This SUBJKT conflicts with a route. You can still access the profile from `tz/<address>`',
}

export function RootErrorBoundary({
  title,
  msg: message,
}: {
  title: string
  msg: string
}) {
  const error = useRouteError() as Error
  let msg = ''
  if (isRouteErrorResponse(error)) {
    msg = get(status_to_string, error.status)
  }
  if (!msg) {
    msg = status_to_string.default
  }
  return (
    <Page title="Error">
      <div className={styles.container}>
        <div className={styles.msg_box}>
          <h1>{title || (error?.cause as string) || msg}</h1>
          <p>{error?.message || message}</p>
        </div>
        <Button href="https://github.com/teia-community/teia-ui/issues">
          <strong>Report Issue</strong>
        </Button>
        <Button to="/">Go back home</Button>
      </div>
    </Page>
  )
}
