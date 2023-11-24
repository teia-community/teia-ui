import Button from './Button'

export default function IncrementButtons({ onClick }) {
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
