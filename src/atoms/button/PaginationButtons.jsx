import Button from './Button'
import styles from '@style'

export default function PaginationButtons({ path, current, min, max }) {
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
