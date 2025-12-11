import { Button } from '@atoms/button'
import { Container } from '@atoms/layout'
import styles from '@style'

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

interface FiltersProps {
  onChange: (filter: string) => void
  filter: string
  items: { type: string; label: string }[]
}

export default function Filters({ onChange, filter, items = [] }: FiltersProps) {
  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
