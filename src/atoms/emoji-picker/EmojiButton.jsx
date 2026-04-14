import { useState, useRef, useEffect, useCallback } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

const pickerStyle = {
  position: 'absolute',
  bottom: '100%',
  right: 0,
  marginBottom: 4,
  zIndex: 10,
}

export default function EmojiButton({ onSelect, theme = 'auto' }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const handleClose = useCallback((e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClose)
      return () => document.removeEventListener('mousedown', handleClose)
    }
  }, [open, handleClose])

  const handleSelect = (emoji) => {
    onSelect(emoji.native)
    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'flex', alignItems: 'flex-end' }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Emoji"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '6px 8px',
          lineHeight: '24px',
          height: 38,
          boxSizing: 'border-box',
        }}
      >
        😀
      </button>
      {open && (
        <div style={pickerStyle}>
          <Picker
            data={data}
            onEmojiSelect={handleSelect}
            theme={theme}
            previewPosition="none"
            skinTonePosition="search"
            maxFrequentRows={1}
          />
        </div>
      )}
    </div>
  )
}
