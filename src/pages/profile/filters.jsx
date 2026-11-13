import { Button } from '@atoms/button'
import { Container } from '@atoms/layout'
import styles from '@style'

// Tour steps shared by the Creations, Collection and Collabs tabs.
export const FILTERS_TEXT =
  'Show all, only OBJKTs for sale on the primary market (by the artist) or secondary market (by collectors), or those not for sale.'
export const VIEW_MODE_STEP = {
  target: 'view-mode',
  text: 'Switch between one OBJKT at a time and a grid.',
  align: 'right',
}

function FilterButton({ type, children, isActive, onClick }) {
  return (
    <Button
      onClick={() => {
        onClick(type)
      }}
    >
      <div
        className={styles.tag}
        style={{ textDecoration: isActive ? 'underline' : 'none' }}
      >
        {children}
      </div>
    </Button>
  )
}

export default function Filters({ onChange, filter, items = [] }) {
  return (
    <Container>
      <div
        data-tour="filters"
        style={{ display: 'flex', width: 'fit-content', marginLeft: 'auto' }}
      >
        {items.map(({ type, label }) => (
          <FilterButton
            key={type}
            type={type}
            onClick={onChange}
            isActive={filter === type}
            children={label}
          />
        ))}
      </div>
    </Container>
  )
}
