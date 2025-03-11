import { useOutletContext } from 'react-router'
import { useFormContext, useFormState } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useCopyrightStore } from '@context/copyrightStore'
import CopyrightMainForm from './CopyrightMainForm'

export default function CopyrightForm() {
  const { address, minterName } = useOutletContext()
  const navigate = useNavigate()
  const { control } = useFormContext()
  const { defaultValues } = useFormState({ control })

  const handleCopyrightCreation = async (data) => {
    try {
      console.log('Minting Copyright with data:', data) 
      useCopyrightStore.setState({ ...data, isValid: true })
      navigate('preview')
    } catch (error) {
      console.error('Copyright creation failed:', error.message)
    }
  }

  return (
    <motion.div
      style={{ width: '100%' }}
      initial={{ x: '-20%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-20%', opacity: 0 }}
      transition={{ ease: 'easeInOut' }}
    >
      <CopyrightMainForm
        defaultValues={defaultValues}
        onSubmit={handleCopyrightCreation}
        fields={[{ name: 'customLicenseData', defaultValue: {} }]}
      />
    </motion.div>
  )
}
