import React from 'react'
import { Tags } from '../tags'
import { MIMETYPE } from '@constants'
import { RenderMediaType } from '../media-types'
import { HTMLWarning } from '../media-types/html/warning'
import styles from '@style'

function isHTML(mimeType) {
  return (
    mimeType === MIMETYPE.ZIP ||
    mimeType === MIMETYPE.ZIP1 ||
    mimeType === MIMETYPE.ZIP2
  )
}

export const Preview = ({
  title,
  description,
  mimeType,
  previewUri,
  tags,
  rights,
  rightUri,
  language,
  nsfw,
  photosensitiveSeizureWarning,
  amount,
  royalties,
}) => {
  const token_tags = tags
    ? tags === ''
      ? []
      : tags.replace(/\s/g, '').split(',')
    : []
  return (
    <div className={styles.container}>
      {isHTML(mimeType) && <HTMLWarning />}
      <div className={styles.media}>
        <RenderMediaType
          nft={{ mime: mimeType }}
          previewUri={previewUri}
          interactive
          preview
          displayView
        />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>
          <strong>Title:</strong>
          {title}
        </div>
        <div className={styles.field}>
          <strong>Description:</strong>
          {description}
        </div>

        <div className={styles.field}>
          <strong>License:</strong> {rights.label}
        </div>
        <div className={styles.field}>
          <strong>Language:</strong> {language?.label}
        </div>
        {(photosensitiveSeizureWarning || nsfw) && (
          <div className={styles.attributes}>
            <strong>Attributes:</strong>
            {nsfw && (
              <span className={styles.label} title={'This artwork is NSFW'}>
                NSFW
              </span>
            )}
            {photosensitiveSeizureWarning && (
              <span
                className={styles.label}
                title={'This artwork can cause seizures'}
              >
                Photo Sensitive Seizure Warning!
              </span>
            )}
          </div>
        )}
        <div className={styles.attributes}>
          <strong>Tags:</strong>
          <Tags tags={token_tags} />
        </div>
      </div>
    </div>
  )
}
