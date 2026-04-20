import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@atoms/button'
import { isTzAddress } from '@utils/string'
import UserSearchDropdown from './UserSearchDropdown'
import styles from './index.module.scss'

export default function DmRecipientInput() {
  const [value, setValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  const goTo = (addr) => {
    const trimmed = addr.trim()
    if (trimmed) {
      navigate(`/messages/dm/${trimmed}`)
      setValue('')
    }
  }

  const validAddress = isTzAddress(value)

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
          if (e.key === 'Enter' && validAddress) goTo(value)
        }}
      />
      <Button shadow_box onClick={() => goTo(value)} disabled={!validAddress}>
        Message
      </Button>
      {showDropdown && !validAddress && (
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
