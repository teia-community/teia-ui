import { isRouteErrorResponse, useRouteError } from 'react-router'
import styles from '@style'

const status_to_string = {
  404: "This page doesn't exist!",
  401: "You aren't authorized to see this",
  503: 'Looks like our API is down',
  418: '🫖',
  default: 'Something went wrong',
}

export function ErrorBoundary() {
  const error = useRouteError()
  let msg = ''
  if (isRouteErrorResponse(error)) {
    msg = status_to_string[error.status]
  }
  if (!msg) {
    msg = status_to_string.default
  }

  return <div className={styles.container}>{msg}</div>
}
