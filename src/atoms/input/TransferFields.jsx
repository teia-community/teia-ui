import { Button } from '@atoms/button'
import SimpleInput from './SimpleInput'

export default function TransferFields({
  labels,
  placeholders,
  transfers,
  onChange,
  className,
  step,
  children,
}) {
  const handleChange = (index, parameter, value) => {
    const newTransfers = transfers.map((transfer) => ({ ...transfer }))
    newTransfers[index][parameter] = value
    onChange(newTransfers)
  }

  const handleClick = (e, increase) => {
    e.preventDefault()
    const newTransfers = transfers.map((transfer) => ({ ...transfer }))

    if (increase) {
      newTransfers.push({ amount: '', destination: '' })
    } else if (newTransfers.length > 1) {
      newTransfers.pop()
    }

    onChange(newTransfers)
  }

  return (
    <div>
      {transfers.map((transfer, index) => (
        <div key={index}>
          <SimpleInput
            type="number"
            label={`${labels.amount} (${index + 1})`}
            placeholder={placeholders?.amount ?? '0'}
            min="0"
            step={step}
            value={transfer.amount}
            onChange={(value) => handleChange(index, 'amount', value)}
            className={className}
          >
            {children}
          </SimpleInput>

          <SimpleInput
            type="text"
            label={`${labels.destination} (${index + 1})`}
            placeholder={placeholders?.destination ?? 'tz1...'}
            minlenght="36"
            maxlength="36"
            value={transfer.destination}
            onChange={(value) => handleChange(index, 'destination', value)}
            className={className}
          >
            {children}
          </SimpleInput>
        </div>
      ))}
      <Button shadow_box inline onClick={(e) => handleClick(e, true)}>
        +
      </Button>
      <Button shadow_box inline onClick={(e) => handleClick(e, false)}>
        -
      </Button>
    </div>
  )
}
