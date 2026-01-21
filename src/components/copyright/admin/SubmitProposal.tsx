import { useState, useEffect } from 'react'
import Button from '@atoms/button/Button'
import { Input, Textarea } from '@atoms/input'
import styles from './index.module.scss'
import { useProposalStore } from '@context/proposalStore'
import { fetchAllCopyrights } from '@data/swr'

import { useUserStore } from '@context/userStore'

const proposalKinds = [
  { label: 'Agreement Text (IPFS or Text)', value: 'agreement_text' },
  { label: 'Treasury Fee (Mutez)', value: 'treasury_fee' },
  { label: 'Treasury Address', value: 'treasury_address' },
  { label: 'Multisig Address', value: 'multisig_address' },
  { label: 'Set Active Copyright ID', value: 'copyright_state' },
]

export default function SubmitProposal() {
  const address = useUserStore((state) => state.address)
  const [kind, setKind] = useState('agreement_text')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [existingCopyrights, setExistingCopyrights] = useState<any[]>([])
  const submitProposal = useProposalStore((s) => s.submitProposal)

  useEffect(() => {
    if (kind === 'copyright_state') {
      fetchAllCopyrights().then(setExistingCopyrights)
    } else {
      setExistingCopyrights([])
    }
  }, [kind])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await submitProposal(kind, text)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.form_section}>
      <h2 className={styles.title}>Create Proposal</h2>
      <p>Admin area for the copyright registration process. This uses the same multisig contract functions as "KT1J9FYz29RBQi1oGLw8uXyACrzXzV1dHuvb" in order to administer the current registration contract.</p>
      {/* Kind Selector */}
      <div className={styles.field}>
        <br />
        <label className={styles.label} htmlFor="kind">Proposal Type</label>
        <br />
        <select
          id="kind"
          className={styles.select}
          value={kind}
          onChange={(e) => {
            setKind(e.target.value)
            setText('')
          }}
        >
          {proposalKinds.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <br />
      </div>

      {/* Dynamic Input Field */}
      <div className={styles.field}>
        {kind === 'agreement_text' && (
          <>
            <label className={styles.label} htmlFor="text">IPFS Hash or Text</label>
            <Textarea
              name="text"
              style={{ border: '1px solid var(--text-color)' }}
              placeholder="e.g. ipfs://Qm... or full agreement body"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
          </>
        )}

        {kind === 'treasury_fee' && (
          <>
            <label className={styles.label} htmlFor="text">Treasury Fee (in mutez)</label>
            <Input
              name="text"
              type="number"
              placeholder="e.g. 100000"
              value={text}
              onChange={(v) => setText(typeof v === 'object' && 'target' in v ? (v.target as HTMLInputElement).value : String(v))}
            />
          </>
        )}

        {(kind === 'treasury_address' || kind === 'multisig_address') && (
          <>
            <label className={styles.label} htmlFor="text">Address</label>
            <Input
              type="text"
              name="text"
              placeholder="e.g. tz1..."
              value={text}
              onChange={(v) => setText(typeof v === 'object' && 'target' in v ? (v.target as HTMLInputElement).value : String(v))}
            />
          </>
        )}

        {kind === 'copyright_state' && (
          <>
            <label className={styles.label} htmlFor="text">Select Copyright ID</label>
            <select
              id="text"
              className={styles.select}
              value={text}
              onChange={(e) => setText(e.target.value)}
            >
              <option value="" disabled>Select one...</option>
              {existingCopyrights.map((entry) => {
                const id = `${entry.key.address}-${entry.key.nat}`
                const label = id
                return (
                  <option key={entry.id} value={id}>
                    {label}
                  </option>
                )
              })}
            </select>
          </>
        )}
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={submitting || !text} shadow_box fit>
        {submitting ? 'Submitting...' : 'Submit Proposal'}
      </Button>
    </div>
  )
}
