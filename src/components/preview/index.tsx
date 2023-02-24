import { Tags } from '../tags'
import { MIMETYPE } from '@constants'
import { RenderMediaType } from '../media-types'
import { HTMLWarning } from '../media-types/html/warning'
import styles from '@style'
import { motion } from 'framer-motion'
import { useMintStore } from '@context/mintStore'
import { Button } from '@atoms/button'
import useSettings from '@hooks/use-settings'
function isHTML(mimeType) {
  return (
    mimeType === MIMETYPE.ZIP ||
    mimeType === MIMETYPE.ZIP1 ||
    mimeType === MIMETYPE.ZIP2
  )
}

const Attribute = ({ title, children }) => {
  return (
    children && (
      <div className={styles.attributes}>
        <strong>{title}:</strong>
        {children}
      </div>
    )
  )
}

const Field = ({ title, value }) => {
  return (
    value && (
      <div className={styles.field}>
        <strong>{title}:</strong>
        {value}
      </div>
    )
  )
}
export const Preview = () => {
  // const { getValues } = useFormContext()
  // const { tags, title, description, artifact, license } = getValues()
  const [
    tags,
    title,
    description,
    artifact,
    cover,
    license,
    custom_license_uri,
    royalties,
    language,
    photosensitiveSeizureWarning,
    nsfw,
    editions,
  ] = useMintStore((st) => [
    st.tags,
    st.title,
    st.description,
    st.artifact,
    st.cover,
    st.license,
    st.custom_license_uri,
    st.royalties,
    st.language,
    st.photosensitive,
    st.nsfw,
    st.editions,
  ])

  const { ignoreUriMap } = useSettings()
  const token_tags = tags
    ? tags === ''
      ? []
      : tags.replace(/\s/g, '').split(',')
    : []

  if (!artifact) {
    return (
      <motion.div
        style={{ width: '100%' }}
        initial={{ x: '20%' }}
        animate={{ x: 0 }}
        exit={{ x: '20%' }}
        transition={{ ease: 'easeInOut' }}
      >
        <p>No file provided for preview</p>
      </motion.div>
    )
  }
  return (
    <motion.div
      style={{ width: '100%' }}
      initial={{ x: '20%' }}
      animate={{ x: 0 }}
      exit={{ x: '20%' }}
      transition={{ ease: 'easeInOut' }}
    >
      {isHTML(artifact.mimeType) && <HTMLWarning />}
      <div className={styles.media}>
        <RenderMediaType
          displayView
          nft={{ mime_type: artifact.mimeType }}
          previewUri={artifact.reader}
          previewDisplayUri={cover?.reader}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>
          <strong>Title:</strong>
          {title}
        </div>
        <Field title="Description" value={description} />
        <Field title="License" value={license?.label} />
        <Field title="License URI" value={custom_license_uri} />
        <Field title="Language" value={language?.label} />

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
        <Attribute title="Tags">
          {token_tags?.length > 0 && <Tags tags={token_tags} />}
        </Attribute>
        <Attribute title="Editions">{editions}</Attribute>
        <Attribute title="Royalties">{royalties}%</Attribute>
      </div>
      <Button
        onClick={() => useMintStore.getState().mint(ignoreUriMap)}
        shadow_box
        fit
      >
        Mint
      </Button>
    </motion.div>
  )
}
