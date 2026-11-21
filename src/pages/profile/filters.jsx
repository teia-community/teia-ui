import { Button } from '@atoms/button'
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

export default function Filters({ onChange, filter, items = [] }) {
  return (
    <div className={styles.filters_bar}>
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
    </div>
  )
}
