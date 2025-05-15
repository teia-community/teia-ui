import { memo } from 'react'
import { useFormContext } from 'react-hook-form'
import { CopyrightFormFields } from './CopyrightFormFields'
import { Button } from '@atoms/button'

function CopyrightMainForm({ fields, defaultValues, onSubmit }) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useFormContext()

  return (
    <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
      {fields.map((f) => (
        <CopyrightFormFields
          key={f.name}
          control={control}
          field={{
            ...f,
            defaultValue: defaultValues?.[f.name],
          }}
        />
      ))}
      <Button type="submit" fit shadow_box disabled={Object.keys(errors).length > 0}>
        Create Copyright
      </Button>
    </form>
  );
}

export default memo(CopyrightMainForm)
