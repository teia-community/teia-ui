import { useEffect } from 'react'

export function useTitle(title: string) {
  useEffect(() => {
    // const prevTitle = document.title
    document.title = title ? `${title} - teia` : 'teia'
    // return () => {
    //   console.log(`exiting ${prevTitle}`)
    //   document.title = prevTitle
    // }
  }, [title])
}
