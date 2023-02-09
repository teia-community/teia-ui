import { Controller } from 'react-hook-form'
import { Checkbox, Input, Textarea } from '@atoms/input'
import { Line } from '@atoms/line'
import Select from '@atoms/select/Base'
import { kebabCase } from 'lodash'
import styles from '@style'
import { memo } from 'react'

const FieldError = memo(({ error }) => <p className={styles.error}>{error}</p>)
export const FormFields = ({ field, error, register }) => {
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
        <Select
          className={styles.field}
          options={field.options}
          search={field.type === 'select-search'}
          label={field.label}
        />
      )
    case 'checkbox':
      return <Checkbox className={styles.field} label={field.label} />

    default:
      return <p>Unknown {field.label}</p>
  }
}
