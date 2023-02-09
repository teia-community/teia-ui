import { Checkbox, Input, Textarea } from '@atoms/input'
import { Line } from '@atoms/line'
import Select from '@atoms/select/Base'
import { kebabCase } from 'lodash'
import styles from '@style'
import { memo } from 'react'
import { Upload } from '@components/upload/index'
import { ALLOWED_FILETYPES_LABEL } from '@constants'
import { Controller } from 'react-hook-form'

const FieldError = memo(({ error }) => <p className={styles.error}>{error}</p>)

export const FormFields = ({ field, error, register, control }) => {
  const name = field.name || kebabCase(field.label)

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
          {error && <FieldError error={error.message} />}
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
          {error && <FieldError error={error.message} />}
        </Textarea>
      )
    case 'select':
    case 'select-search':
      return (
        <Controller
          control={control}
          defaultValue={field.defaultValue}
          name={name}
          render={({ field: { onChange, value, name, ref } }) => (
            <Select
              inputRef={ref}
              className={styles.field}
              options={field.options}
              search={field.type === 'select-search'}
              label={field.label}
              onChange={(val) => onChange(val.value)}
            />
          )}
        />
      )
    case 'checkbox':
      return (
        <Checkbox
          className={styles.field}
          label={field.label}
          {...register(name, field.rules)}
        />
      )

    case 'file':
      return (
        <Upload
          label={field.label}
          placeholder={field.placeholder}
          className={styles.field}
          allowedTypesLabel={ALLOWED_FILETYPES_LABEL}
          {...register(name, field.rules)}
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
