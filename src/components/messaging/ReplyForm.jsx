import { useState, useRef, useCallback } from 'react'
import { Button } from '@atoms/button'
import styles from '@style'

export const ReplyForm = ({ onSubmit, disabled }) => {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [])

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={styles.reply_form}>
      <textarea
        ref={textareaRef}
        className={styles.reply_textarea}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          adjustHeight()
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        disabled={disabled}
      />
      <div className={styles.reply_actions}>
        <Button
          small
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  )
}
