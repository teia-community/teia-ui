import { IncrementButtons } from '@atoms/button'
import SimpleInput from './SimpleInput'
import { ReactNode, MouseEvent } from 'react'

export type Transfer = {
  amount: string | number
  destination: string
}

type TransferFieldsProps = {
  labels: { amount: string; destination: string }
  placeholders?: { amount?: string; destination?: string }
  transfers: Transfer[]
  onChange: (transfers: Transfer[]) => void
  className?: string
  step?: string | number
  children?: ReactNode
}

export default function TransferFields({
  labels,
  placeholders,
  transfers,
  onChange,
  className,
  step,
  children,
}: TransferFieldsProps) {
  const handleChange = (index: number, parameter: keyof Transfer, value: any) => {
    const newTransfers = transfers.map((transfer) => ({ ...transfer }))
    newTransfers[index][parameter] = value
    onChange(newTransfers)
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>, increase: boolean) => {
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
            minlength={36}
            maxlength={36}
            value={transfer.destination}
            onChange={(value) => handleChange(index, 'destination', value)}
            className={className}
          >
            {children}
          </SimpleInput>
        </div>
      ))}
      <IncrementButtons onClick={handleClick} />
    </div>
  )
}
