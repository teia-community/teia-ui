import Button from './Button'
import { MouseEvent } from 'react'

type IncrementButtonsProps = {
  onClick: (e: MouseEvent<HTMLButtonElement>, increment: boolean) => void
}

export default function IncrementButtons({ onClick }: IncrementButtonsProps) {
  return (
    <div>
      <Button shadow_box inline onClick={(e) => onClick(e, true)}>
        +
      </Button>
      <Button shadow_box inline onClick={(e) => onClick(e, false)}>
        -
      </Button>
    </div>
  )
}
