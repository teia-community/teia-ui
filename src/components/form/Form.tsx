import Button from '@atoms/button/Button'
import { get } from 'lodash'
import { memo, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormFields } from './FormFields'
import { useMintStore } from '@context/mintStore'

function Form({ fields, defaultValues, children, onSubmit, onReset }: { fields: any[]; defaultValues?: any; children?: React.ReactNode; onSubmit: (data: any) => void; onReset?: () => void }) {
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
      {fields.map((f: any) => {
        const value = f.watch ? watch(f.name) : null
        return (
          <FormFields
            key={f.name}
            register={register}
            value={value}
            control={control}
            field={{
              ...f,
              defaultValue: defaultValues?.[f.name],
            }}
            error={get(errors, f.name)}
          />
        )
      })}
      {children}
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
