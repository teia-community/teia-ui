import React from 'react'
import { Helmet } from 'react-helmet'
import classnames from 'classnames'
import { Header } from '@components/header'
import { FeedbackComponent } from '@components/feedback'
import { VisuallyHidden } from '../../visually-hidden'
import styles from './styles.module.scss'

export const Page = ({ title = '', children = null, large }) => {
  const classes = classnames({
    [styles.container]: true,
    [styles.large]: large,
  })
  return (
    <>
      <Header />
      <FeedbackComponent />
      <main className={classes}>
        <Helmet>
          {title !== '' ? <title>{title} - teia</title> : <title>teia</title>}
        </Helmet>
        <VisuallyHidden as="h1">{title}</VisuallyHidden>
        {children}
      </main>
    </>
  )
}
