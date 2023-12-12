import { Button } from '@atoms/button'
import styles from '@style'

function FilterButton({ type, children, isActive, onClick }) {
  return (
    <Button
      small
      onClick={() => {
        onClick(type)
      }}
    >
      <div
        className={styles.filter}
        style={{ textDecoration: isActive ? 'underline' : 'none' }}
      >
        {children}
      </div>
    </Button>
  )
}

export default function Filters({ onChange, filter, items = [] }) {
  return (
    <div className={styles.filters}>
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
  )
}
