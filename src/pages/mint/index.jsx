import { Page } from '@atoms/layout'
import { Tabs } from '@atoms/tab/Tabs'
import { useMintStore } from '@context/mintStore'
import { useUserStore } from '@context/userStore'
import { AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import { FormProvider, useForm, useFormState } from 'react-hook-form'
import { Outlet } from 'react-router'

/**@type {import('@atoms/tab/Tabs').TabOptions} */
let TABS = [
  { title: 'Edit', to: '' },
  { title: 'Preview', to: 'preview', disabled: true },
  { title: 'Mint', disabled: true },
]

export default function Mint() {
  // create shared form
  const methods = useForm({
    defaultValues: useMintStore.getState(),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  const address = useUserStore((st) => st.address)
  const userInfo = useUserStore((st) => st.userInfo)
  const proxyAddress = useUserStore((st) => st.proxyAddress)
  const proxyName = useUserStore((st) => st.proxyName)

  const { isValid, errors, isDirty } = useFormState({
    control: methods.control,
  })

  // const onValidSubmit = (data) => {
  //   console.log({ data })
  //   TABS[1].disabled = false
  // }
  const tabs = useMemo(() => {
    TABS[1].disabled = isDirty || !isValid || Object.keys(errors).length > 0
    return TABS
  }, [isValid, errors, isDirty])

  // useEffect(() => useMintStore.subscribe((st) => st.isValid, checkValidity), [])

  const minterName = useMemo(() => {
    return proxyName || proxyAddress || userInfo?.name || address
  }, [address, proxyAddress, proxyName, userInfo?.name])

  // get the user balance
  const balance = useMemo(() => {
    if (address) {
      return useUserStore
        .getState()
        .getBalance(address)
        .then((bal) => {
          return bal
        })
    }
  }, [address])

  return (
    <Page title="Mint" large>
      <FormProvider {...methods}>
        <h1>MINT</h1>

        <Tabs tabs={tabs} />
        {/* <Example /> */}
        <AnimatePresence mode="sync">
          <Outlet
            context={{
              balance,
              minterName,
              address,
              artifact: methods.watch('artifact'),
              license:
                methods.watch(
                  'license'
                ) /*onSubmit: methods.handleSubmit(onSubmit)*/,
            }}
          />
        </AnimatePresence>
      </FormProvider>
    </Page>
  )
}
