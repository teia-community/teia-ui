import { Checkbox, Input, Textarea } from '@atoms/input'
import { Line } from '@atoms/line'
import Select from '@atoms/select/Base'
import styles from '@style'
import { memo, useState, useRef, CSSProperties } from 'react'
import { Upload } from '@components/upload/index'
import { AudioVisualizer } from 'react-audio-visualize'
import {
  ALLOWED_FILETYPES_LABEL,
  ALLOWED_COVER_FILETYPES_LABEL,
  AUDIO_MIME_TYPES,
} from '@constants'
import { Controller, useFormContext } from 'react-hook-form'
import classNames from 'classnames'
import { processAudioForVisualizer } from '@utils/mint'
import { Button } from '@atoms/button'
import MetadataOverlay, {
  combineVisualizerWithMetadata,
} from './AudioCoverMetadataOverlay'
import { useUserStore } from '@context/userStore'
import { shallow } from 'zustand/shallow'

const FieldError = memo(({ error, text }: { error: any; text?: boolean }) => {
  const classes = classNames({
    [styles.error]: true,
    [styles.text_field_error]: text,
  })
  return <p className={classes}>{error}</p>
})

/**
 * Wrapper of atoms to react form with local storage support
 */
export const FormFields = ({ value, field, error, register, control }) => {
  const name = field.name
  const { watch } = useFormContext()
  const [address, userInfo] = useUserStore(
    (st) => [st.address, st.userInfo],
    shallow
  )
  const [showVisualizer, setShowVisualizer] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob>()
  const visualizerRef = useRef(null)
  const getArtistText = (userInfo, address) => {
    if (userInfo?.name) {
      return `${userInfo.name} (${address})`
    }
    return address
  }

  switch (field.type) {
    case 'text':
    case 'number':
      return (
        <Input
          className={styles.field}
          name={name}
          type={field.type}
          label={field.label}
          defaultValue={field.defaultValue}
          placeholder={field.placeholder}
          {...register(name, field.rules)}
        >
          <Line />
          {error && <FieldError text error={error.message} />}
        </Input>
      )
    case 'textarea':
      return (
        <Textarea
          className={styles.field}
          label={field.label}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          {...register(name, field.rules)}
        >
          <Line />
          {error && <FieldError text error={error.message} />}
        </Textarea>
      )
    case 'typed-textarea':
      return (
        <Textarea
          className={styles.typed_field}
          label={field.label}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          {...register(name, field.rules)}
        >
          <Line />
          {error && <FieldError text error={error.message} />}
        </Textarea>
      )
    case 'select':
    case 'select-search':
      return (
        <Controller
          control={control}
          defaultValue={field.defaultValue}
          name={name}
          rules={field.rules}
          render={({ field: { onChange, value, name, ref } }) => (
            <Select
              inputRef={ref}
              className={styles.field}
              options={field.options}
              value={value}
              search={field.type === 'select-search'}
              label={field.label}
              placeholder={field.placeholder}
              defaultValue={field.defaultValue}
              onChange={onChange}
            />
          )}
        />
      )
    case 'checkbox':
      return (
        <Controller
          control={control}
          defaultValue={field.defaultValue}
          name={name}
          rules={field.rules}
          render={({ field: { onChange, value, name, ref } }) => (
            <Checkbox
              ref={ref}
              className={styles.field}
              label={field.label}
              initial={field.defaultValue}
              checked={value}
              onCheck={(v) => onChange(v)}
            />
          )}
        />
      )

    case 'file':
      return (
        <Controller
          control={control}
          defaultValue={field.defaultValue}
          name={name}
          rules={field.rules}
          render={({ field: { onChange, value, name, ref } }) => (
            <Upload
              ref={ref}
              name={name}
              file={value?.file}
              label={field.label}
              placeHolder={value ? value?.file?.name : field.placeHolder}
              className={styles.field}
              onChange={onChange}
              allowedTypesLabel={ALLOWED_FILETYPES_LABEL}
            >
              {error && <FieldError error={error.message} />}
            </Upload>
          )}
        />
      )

    case 'cover-file':
      return (
        <Controller
          control={control}
          defaultValue={field.defaultValue}
          name={name}
          rules={field.rules}
          render={({ field: { onChange, value, name, ref } }) => {
            const fileValue = watch(value)
            const isAudioMimeType =
              fileValue &&
              AUDIO_MIME_TYPES.includes(fileValue.artifact?.mimeType)

            const handleShowVisualizer = () => {
              if (!showVisualizer && fileValue?.artifact?.reader) {
                const blob = processAudioForVisualizer(
                  fileValue.artifact.reader
                )
                // Store the processed blob on the fileValue object itself
                setAudioBlob(blob)
              }
              setShowVisualizer(true)
            }

            const containerStyle: CSSProperties = {
              position: 'relative',
              width: '100%',
              maxWidth: '618px',
              aspectRatio: '618/382',
              backgroundColor: 'black',
              overflow: 'hidden',
            }

            const visualizerContainerStyle: CSSProperties = {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }

            const handleSaveImage = async () => {
              if (!visualizerRef.current) return

              try {
                const finalBlob = await combineVisualizerWithMetadata(
                  visualizerRef.current,
                  fileValue
                )

                const url = URL.createObjectURL(finalBlob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${fileValue.artifact?.name || 'audio'}_cover.png`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                const newFile = new File(
                  [finalBlob],
                  `${fileValue.artifact?.name || 'audio'}_cover.png`,
                  { type: 'image/png' }
                )
                onChange({ file: newFile })
              } catch (error) {
                console.error('Failed to save image:', error)
              }
            }

            return (
              <>
                {isAudioMimeType && !showVisualizer && (
                  <Button
                    className={styles['visualizer-image-download-button']}
                    onClick={() => handleShowVisualizer()}
                  >
                    Generate Audio Visualization
                  </Button>
                )}

                {isAudioMimeType && showVisualizer && (
                  <div className={styles.field}>
                    <p>Generated Image (Save and Upload Manually)</p>
                    <div ref={visualizerRef} style={containerStyle}>
                      <div style={visualizerContainerStyle}>
                        {audioBlob && (
                          <AudioVisualizer
                            blob={audioBlob}
                            width={618}
                            height={382}
                            backgroundColor="black"
                            barColor="white"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                            }}
                          />
                        )}
                        <MetadataOverlay
                          title={watch('title') || 'Untitled'}
                          artist={getArtistText(userInfo, address)}
                          mimeType={fileValue?.artifact?.mimeType}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 1,
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      className={styles['visualizer-image-download-button']}
                      onClick={handleSaveImage}
                    >
                      Download As File
                    </Button>
                  </div>
                )}

                <Upload
                  ref={ref}
                  name={name}
                  file={value?.file}
                  label={field.label}
                  placeHolder={value ? value?.file?.name : field.placeHolder}
                  className={styles.field}
                  onChange={onChange}
                  allowedTypesLabel={ALLOWED_COVER_FILETYPES_LABEL}
                >
                  {error && <FieldError error={error.message} />}
                </Upload>
              </>
            )
          }}
        />
      )

    default:
      return (
        <p>
          Unknown field {field.label} of type {field.type}
        </p>
      )
  }
}
