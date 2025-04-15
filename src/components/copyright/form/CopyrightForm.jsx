import { useFormContext, useFormState } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useCopyrightStore } from '@context/copyrightStore'
import CopyrightMainForm from './CopyrightMainForm'

export default function CopyrightForm() {
  const navigate = useNavigate()
  const { control } = useFormContext()
  const { defaultValues } = useFormState({ control })

  // Load existing data from Zustand store
  const { customLicenseData } = useCopyrightStore()

  const handleCopyrightCreation = async (data) => {
    try {
      const { customLicenseData } = useCopyrightStore.getState()
  
      useCopyrightStore.setState({
        ...data,
        customLicenseData: { 
          ...data.customLicenseData, 
          tokens: customLicenseData?.tokens || [],
        },
        isValid: true,
      })
  
      navigate('copyrightpreview')
    } catch (error) {
      console.error('Copyright creation failed:', error.message)
    }
  };
  
  return (
    <motion.div
      style={{ width: '100%' }}
      initial={{ x: '-20%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-20%', opacity: 0 }}
      transition={{ ease: 'easeInOut' }}
    >
      <CopyrightMainForm
        defaultValues={{ ...defaultValues, customLicenseData }}
        onSubmit={handleCopyrightCreation}
        fields={[{ name: 'customLicenseData', defaultValue: customLicenseData || {} }]}
      />
    </motion.div>
  )
}
