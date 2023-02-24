import { useRef, useEffect, useCallback } from 'react'
import { SWRHook } from 'swr'
import { Middleware, PublicConfiguration } from 'swr/dist/types'

// taken from https://swr.vercel.app/docs/middleware#keep-previous-result

// This is a SWR middleware for keeping the data even if key changes.
function laggy(useSWRNext: SWRHook) {
  return (
    key: string,
    fetcher: (e: string) => any,
    config: PublicConfiguration
  ) => {
    // Use a ref to store previous returned data.
    const laggyDataRef = useRef<ReturnType<typeof fetcher>>()

    // Actual SWR hook.
    const swr = useSWRNext(key, fetcher, config)

    useEffect(() => {
      // Update ref if data is not undefined.
      if (swr.data !== undefined) {
        laggyDataRef.current = swr.data
      }
    }, [swr.data])

    // Expose a method to clear the laggy data, if any.
    const resetLaggy = useCallback(() => {
      laggyDataRef.current = undefined
    }, [])

    // Fallback to previous data if the current data is undefined.
    const dataOrLaggyData =
      swr.data === undefined ? laggyDataRef.current : swr.data

    // Is it showing previous data?
    const isLagging =
      swr.data === undefined && laggyDataRef.current !== undefined

    // Also add a `isLagging` field to SWR.
    return Object.assign({}, swr, {
      data: dataOrLaggyData,
      isLagging,
      resetLaggy,
    })
  }
}

export default laggy as Middleware
