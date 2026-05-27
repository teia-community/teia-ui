import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button } from '@atoms/button'
import { useUserStore } from '@context/userStore'
import { useClickOutside } from '@hooks/use-click-outside'
import { validateAddress } from '@taquito/utils'
import { createChannel } from '@data/messaging/channel-actions'
import { isTzAddress, walletPreview } from '@utils/string'
import UserSearchDropdown from '@components/shared/UserSearchDropdown'
import styles from './index.module.scss'

function StepIndicator({ current, labels }) {
  return (
    <div className={styles.stepIndicator}>
      {labels.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div
                className={
                  done || active ? styles.stepLineActive : styles.stepLine
                }
              />
            )}
            <div
              className={
                done
                  ? styles.stepCircleDone
                  : active
                  ? styles.stepCircleActive
                  : styles.stepCircle
              }
              title={label}
            >
              {done ? '✓' : step}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AdminInput({ admins, onAdd, onRemove }) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const addAddress = (addr, alias) => {
    if (isTzAddress(addr) && !admins.some((a) => a.address === addr)) {
      onAdd({ address: addr, alias: alias || walletPreview(addr) })
    }
    setQuery('')
    setShowDropdown(false)
  }

  const validAddress = isTzAddress(query.trim())

  return (
    <div className={styles.adminInput}>
      <div className={styles.adminInputRow}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className={styles.formInput}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && validAddress) {
                e.preventDefault()
                addAddress(query.trim(), '')
              }
            }}
            placeholder="Enter tz address or name..."
          />
          {showDropdown && query.length >= 2 && !isTzAddress(query) && (
            <UserSearchDropdown
              query={query}
              onSelect={(user) => addAddress(user.user_address, user.name)}
              onClose={() => setShowDropdown(false)}
            />
          )}
        </div>
        <Button
          shadow_box
          onClick={() => addAddress(query.trim(), '')}
          disabled={!validAddress}
        >
          Add
        </Button>
      </div>
      {admins.length > 0 && (
        <div className={styles.adminList}>
          {admins.map((a) => (
            <div key={a.address} className={styles.adminChip}>
              <span className={styles.adminChipName}>{a.alias}</span>
              <button
                type="button"
                className={styles.adminChipRemove}
                onClick={() => onRemove(a.address)}
                title="Remove"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CreateChannelModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const address = useUserStore((st) => st.address)
  const contentRef = useRef(null)

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [accessMode, setAccessMode] = useState('unrestricted')
  const [admins, setAdmins] = useState([])
  const [allowlistText, setAllowlistText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isAllowlist = accessMode === 'allowlist'

  const stepLabels = isAllowlist
    ? ['Basic Info', 'Access', 'Allowlist', 'Review']
    : ['Basic Info', 'Access', 'Review']

  const totalSteps = stepLabels.length
  const reviewStep = totalSteps

  useClickOutside(contentRef, () => {
    if (isOpen && !submitting) onClose()
  })

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setName('')
      setDescription('')
      setImageFile(null)
      setImagePreviewUrl(null)
      setAccessMode('unrestricted')
      setAdmins([])
      setAllowlistText('')
      setSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, submitting, onClose])

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImagePreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setImagePreviewUrl(null)
  }, [imageFile])

  const allowlistAddresses = isAllowlist
    ? allowlistText
        .split(/[\n,]+/)
        .map((a) => a.trim())
        .filter(Boolean)
    : []
  const invalidAddresses = allowlistAddresses.filter(
    (a) => validateAddress(a) !== 3
  )

  const addAdmin = (admin) => setAdmins((prev) => [...prev, admin])
  const removeAdmin = (addr) =>
    setAdmins((prev) => prev.filter((a) => a.address !== addr))

  const canNext = () => {
    if (step === 1) return name.trim().length > 0
    if (step === 2) return true
    if (isAllowlist && step === 3) {
      return allowlistAddresses.length > 0 && invalidAddresses.length === 0
    }
    return true
  }

  const handleAllowlistClick = () => {
    setAccessMode('allowlist')
    setStep(3)
  }

  const handleBack = () => {
    if (isAllowlist && step === 3) {
      setAccessMode('unrestricted')
      setAdmins([])
      setStep(2)
      return
    }
    setStep((s) => s - 1)
  }

  const handleNext = () => {
    if (step === 2 && !isAllowlist) {
      setStep(3)
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleSubmit = async () => {
    if (submitting || !address) return
    setSubmitting(true)
    try {
      const { channelId } = await createChannel({
        kind: 'channel',
        name: name.trim(),
        description: description.trim(),
        imageFile,
        accessMode,
        merkleAddresses: isAllowlist ? allowlistAddresses : undefined,
        admins: admins.map((a) => a.address),
        creator: address,
      })
      onClose()
      navigate(channelId ? `/inbox/channels/${channelId}` : '/inbox')
    } catch (err) {
      console.warn('Create channel failed:', err)
      setSubmitting(false)
    }
  }

  const accessLabel =
    accessMode === 'unrestricted'
      ? 'Public'
      : accessMode === 'closed'
      ? 'Private'
      : 'Allowlist'

  if (!isOpen) return null

  return createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.wizardModal} ref={contentRef}>
        <h2 className={styles.wizardTitle}>Create Channel</h2>
        <StepIndicator current={step} labels={stepLabels} />

        <div className={styles.wizardBody}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <label className={styles.formLabel}>
                Name
                <input
                  type="text"
                  className={styles.formInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Channel name"
                />
              </label>
              <label className={styles.formLabel}>
                Description (optional)
                <textarea
                  className={styles.formTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this channel about?"
                  rows={3}
                />
              </label>
              <label className={styles.formLabel}>
                Image (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className={styles.imagePreview}
                />
              )}
            </>
          )}

          {/* Step 2: Access Mode (Public / Private) */}
          {step === 2 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  className={
                    accessMode === 'unrestricted'
                      ? styles.accessOptionActive
                      : styles.accessOption
                  }
                  onClick={() => {
                    setAccessMode('unrestricted')
                    setAdmins([])
                  }}
                >
                  <div
                    className={
                      accessMode === 'unrestricted'
                        ? styles.accessOptionRadioActive
                        : styles.accessOptionRadio
                    }
                  />
                  <div className={styles.accessOptionText}>
                    <span className={styles.accessOptionTitle}>Public</span>
                    <span className={styles.accessOptionDesc}>
                      Anyone can post in this channel
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={
                    accessMode === 'closed'
                      ? styles.accessOptionActive
                      : styles.accessOption
                  }
                  onClick={() => setAccessMode('closed')}
                >
                  <div
                    className={
                      accessMode === 'closed'
                        ? styles.accessOptionRadioActive
                        : styles.accessOptionRadio
                    }
                  />
                  <div className={styles.accessOptionText}>
                    <span className={styles.accessOptionTitle}>Private</span>
                    <span className={styles.accessOptionDesc}>
                      Only you and admins can post
                    </span>
                  </div>
                </button>
              </div>

              {accessMode === 'closed' && (
                <div className={styles.adminSection}>
                  <div className={styles.formLabel}>
                    Add admins (optional)
                    <span className={styles.accessOptionDesc}>
                      Admins can post and manage the channel
                    </span>
                  </div>
                  <AdminInput
                    admins={admins}
                    onAdd={addAdmin}
                    onRemove={removeAdmin}
                  />
                </div>
              )}

              <div className={styles.allowlistDivider}>
                <span className={styles.allowlistDividerLine} />
                <span className={styles.allowlistDividerText}>or</span>
                <span className={styles.allowlistDividerLine} />
              </div>

              <button
                type="button"
                className={styles.allowlistButton}
                onClick={handleAllowlistClick}
              >
                <div className={styles.accessOptionText}>
                  <span className={styles.accessOptionTitle}>
                    Allowlist (Merkle Tree)
                  </span>
                  <span className={styles.accessOptionDesc}>
                    Restrict posting to a cryptographically verified list of
                    wallets
                  </span>
                </div>
                <span className={styles.allowlistArrow}>&rarr;</span>
              </button>
            </>
          )}

          {/* Step 3 (allowlist only): Allowlist Setup */}
          {isAllowlist && step === 3 && (
            <>
              <div className={styles.allowlistExplainer}>
                <h4>How Allowlists Work</h4>
                <p>
                  Allowlists use a <strong>Merkle tree</strong> to verify who
                  can post. Each wallet address is hashed into a tree structure,
                  and the contract stores only the root hash on-chain. When a
                  user posts, their wallet provides a cryptographic proof that
                  it belongs to the tree &mdash; no full list needs to be stored
                  on-chain.
                </p>
                <p>
                  <strong>Admins</strong> can always post regardless of the
                  allowlist and can manage channel settings.
                </p>
              </div>

              <div className={styles.adminSection}>
                <div className={styles.formLabel}>
                  Admins (optional)
                  <span className={styles.accessOptionDesc}>
                    Admins can post freely and manage the channel
                  </span>
                </div>
                <AdminInput
                  admins={admins}
                  onAdd={addAdmin}
                  onRemove={removeAdmin}
                />
              </div>

              <label className={styles.formLabel}>
                Allowlist wallets (one per line or comma-separated)
                <textarea
                  className={styles.formTextarea}
                  value={allowlistText}
                  onChange={(e) => setAllowlistText(e.target.value)}
                  placeholder="tz1abc...&#10;tz1def...&#10;tz1ghi..."
                  rows={5}
                />
                {allowlistAddresses.length > 0 &&
                  invalidAddresses.length === 0 && (
                    <span className={styles.addressCount}>
                      {allowlistAddresses.length}{' '}
                      {allowlistAddresses.length === 1
                        ? 'address'
                        : 'addresses'}
                    </span>
                  )}
                {invalidAddresses.length > 0 && (
                  <span className={styles.addressError}>
                    Invalid: {invalidAddresses.join(', ')}
                  </span>
                )}
              </label>
            </>
          )}

          {/* Review step */}
          {step === reviewStep && (
            <div className={styles.reviewSection}>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Name</span>
                <span className={styles.reviewValue}>{name.trim()}</span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Description</span>
                <span
                  className={
                    description.trim() ? styles.reviewValue : styles.reviewEmpty
                  }
                >
                  {description.trim() || 'None'}
                </span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Image</span>
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Channel"
                    className={styles.imagePreview}
                  />
                ) : (
                  <span className={styles.reviewEmpty}>None</span>
                )}
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Access</span>
                <span className={styles.reviewValue}>{accessLabel}</span>
              </div>
              {admins.length > 0 && (
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>
                    Admins ({admins.length})
                  </span>
                  <span className={styles.reviewValue}>
                    {admins.map((a) => a.alias).join(', ')}
                  </span>
                </div>
              )}
              {isAllowlist && allowlistAddresses.length > 0 && (
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>
                    Allowlist ({allowlistAddresses.length})
                  </span>
                  <span className={styles.reviewValue}>
                    {allowlistAddresses.map((a) => walletPreview(a)).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.wizardFooter}>
          <div>
            {step > 1 && (
              <Button shadow_box onClick={handleBack} disabled={submitting}>
                Back
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button shadow_box onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {step < reviewStep ? (
              <Button shadow_box onClick={handleNext} disabled={!canNext()}>
                Next
              </Button>
            ) : (
              <Button shadow_box onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Channel'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
