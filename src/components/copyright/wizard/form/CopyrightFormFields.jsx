import { Controller } from 'react-hook-form'
import CustomCopyrightForm from './CustomCopyrightForm'

export const CopyrightFormFields = ({ field, control }) => {
  return (
    <Controller
      control={control}
      name="customLicenseData"
      defaultValue={field.defaultValue}
      render={({ field: { onChange, value } }) => (
        <CustomCopyrightForm
          onChange={onChange}
          value={value}
          defaultValue={field.defaultValue}
        />
      )}
    />
  )
}
