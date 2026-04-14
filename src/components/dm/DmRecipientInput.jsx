import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@atoms/button'
import UserSearchDropdown from './UserSearchDropdown'
import styles from './index.module.scss'

export default function DmRecipientInput() {
  const [value, setValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(true)
  const navigate = useNavigate()

  const goTo = (addr) => {
    const trimmed = addr.trim()
    if (trimmed) {
      navigate(`/messages/dm/${trimmed}`)
      setValue('')
    }
  }

  const isTzAddress = /^tz[1-3][1-9A-HJ-NP-Za-km-z]{33}$/.test(value.trim())

  return (
    <div className={styles.recipientInput}>
      <input
        type="text"
        className={styles.recipientField}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setShowDropdown(true)
        }}
        placeholder="Enter tz address or name..."
        onKeyDown={(e) => {
          if (e.key === 'Enter' && isTzAddress) goTo(value)
        }}
      />
      <Button shadow_box onClick={() => goTo(value)} disabled={!isTzAddress}>
        Message
      </Button>
      {showDropdown && !isTzAddress && (
        <UserSearchDropdown
          query={value}
          onSelect={(user) => {
            setShowDropdown(false)
            goTo(user.user_address)
          }}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
