import { Checkbox, Input, Textarea } from '@atoms/input'
import { Line } from '@atoms/line'
import Select from '@atoms/select/Base'
import styles from '@style'
import { memo } from 'react'
import { Upload } from '@components/upload/index'
import { ALLOWED_FILETYPES_LABEL } from '@constants'
import { Controller } from 'react-hook-form'
import classNames from 'classnames'

const FieldError = memo(({ error, text }) => {
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

  switch (field.type) {
    case 'text':
    case 'number':
      return (
        <Input
          className={styles.field}
          type={field.type}
          label={field.label}
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
    default:
      return (
        <p>
          Unknown field {field.label} of type {field.type}
        </p>
      )
  }
}
