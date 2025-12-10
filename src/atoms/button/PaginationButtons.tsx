import Button from './Button'
import styles from '@style'

type PaginationButtonsProps = {
  path: string
  current: number
  min: number
  max: number
}

export default function PaginationButtons({ path, current, min, max }: PaginationButtonsProps) {
  return (
    <div>
      <Button
        to={`${path}/${Math.max(min, current - 1)}`}
        className={styles.pagination_button}
        shadow_box
      >
        {current > min ? '❰' : '|'}
      </Button>{' '}
      <Button
        to={`${path}/${Math.min(current + 1, max)}`}
        className={styles.pagination_button}
        shadow_box
      >
        {current < max ? '❱' : '|'}
      </Button>
    </div>
  )
}
