import Button from '@atoms/button/Button'
import { get } from 'lodash'
import { memo, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormFields } from './FormFields'
import { useMintStore } from '@context/mintStore'

function Form({ fields, defaultValues, children, onSubmit, onReset }) {
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
        const field = (
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
        // `tour`: data-tour target for this field (see components/tour)
        return f.tour ? (
          <div
            key={f.name}
            data-tour={f.tour}
            // checkbox labels are full width blocks: hug the label instead
            style={f.type === 'checkbox' ? { width: 'fit-content' } : undefined}
          >
            {field}
          </div>
        ) : (
          field
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

      <Button
        fit
        shadow_box
        disabled={Object.keys(errors).length > 0}
        data-tour="mint-submit"
      >
        Submit
      </Button>
    </form>
  )
}

export default memo(Form)
