import Button from '@atoms/button/Button'
import { Textarea } from '@atoms/input/index'
import Input from '@atoms/input/Input'
import Select from '@atoms/select/Base'
import { get, kebabCase } from 'lodash'
import React, { memo } from 'react'
import { useForm } from 'react-hook-form'
import { FormFields } from './FormFields'


function Form({ fields, defaultValues, children, onSubmit }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues, mode: 'onChange', reValidateMode: 'onChange' })
  return (
    <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
      {fields.map((f) => (
        <FormFields
          key={kebabCase(f.label)}
          register={register}
          control={control}
          field={f}
          error={get(errors, kebabCase(f.label))}
        />
      ))}
      <Button disabled={Object.keys(errors).length > 0}>Submit</Button>
    </form>
  )
}

export default memo(Form)
