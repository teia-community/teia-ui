import Button from '@atoms/button/Button'
import type getFields from '@pages/mint/fields'
import { get } from 'lodash'
import { memo } from 'react'
import type { FieldError, FieldValues, SubmitHandler } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'
import { FormFields } from './FormFields'

interface FormProps {
  defaultValues: { [key: string]: unknown }
  onSubmit: SubmitHandler<FieldValues>
  onReset: () => void
  fields: ReturnType<typeof getFields>
}

function Form({ fields, defaultValues, onSubmit, onReset }: FormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useFormContext()

  return (
    <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
      {fields.map((f) => {
        const value = f.watch ? watch(f.name) : null
        return (
          <FormFields
            key={f.name}
            register={register}
            value={value}
            control={control}
            field={f}
            error={get(errors, f.name || '') as FieldError}
          />
        )
      })}
      <Button
        onClick={
          () => {
            onReset?.()
            reset(defaultValues)
          }
          /*reset*/
        }
        type="button"
      >
        Clear Fields
      </Button>

      <Button fit shadow_box disabled={Object.keys(errors).length > 0}>
        Submit
      </Button>
    </form>
  )
}

export default memo(Form)
