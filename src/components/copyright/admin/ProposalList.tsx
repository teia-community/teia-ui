import { useState, useEffect } from 'react'
import Button from '@atoms/button/Button'
import styles from './index.module.scss'
import { fetchProposals, fetchAllVotes, fetchExpirationTime } from '@data/swr'
import { useUserStore } from '@context/userStore'
import { useProposalStore } from '@context/proposalStore'

export default function ProposalList() {
  const address = useUserStore((state) => state.address)
  const voteOnProposal = useProposalStore((s) => s.voteOnProposal)
  const executeProposal = useProposalStore((s) => s.executeProposal)

  const [proposals, setProposals] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expirationTime, setExpirationTime] = useState<number>(0)

  useEffect(() => {
    Promise.all([fetchProposals(), address ? fetchAllVotes(address) : Promise.resolve([])])
      .then(([proposalsData, votesData]) => {
        setProposals(proposalsData)
        setVotes(votesData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  useEffect(() => {
    fetchExpirationTime()
      .then((days) => setExpirationTime(Number(days)))
      .catch((err) => {
        console.error('Failed to fetch expiration time:', err)
        setExpirationTime(10)
      })
  }, [])

  function processProposal(entry, votes, address, expirationTime) {
    const proposalId = entry.key
    const kind = Object.keys(entry.value.kind)[0]
    const userVote = votes.find(
      (v) => Number(v.key.nat) === Number(proposalId) && v.key.address === address
    )?.value ?? null

    const yesVotes = votes.filter(
      (v) => Number(v.key.nat) === Number(proposalId) && v.value === true
    ).length

    const noVotes = votes.filter(
      (v) => Number(v.key.nat) === Number(proposalId) && v.value === false
    ).length

    const minVotes = entry.value.minimum_votes
    const positiveVotes = entry.value.positive_votes
    const isExecutable = positiveVotes >= minVotes && !entry.value.executed

    const expiresIn = (() => {
      const proposalDate = new Date(entry.value.timestamp)
      const expirationDate = new Date(proposalDate.getTime() + expirationTime * 86400000)
      const now = new Date()
      const diff = expirationDate.getTime() - now.getTime()
      if (diff <= 0) return '⛔ Expired'
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      return `${days}d ${hours}h ${minutes}m`
    })()

    return {
      proposalId,
      kind,
      userVote,
      yesVotes,
      noVotes,
      minVotes,
      isExecutable,
      expiresIn,
      issuer: entry.value.issuer,
      executed: entry.value.executed,
    }
  }

  if (loading) return <p>Loading proposals...</p>
  if (!proposals.length) return <p>No proposals found.</p>

  return (
    <div className={styles.form_section}>
      <h2 className={styles.title}>Active Proposals</h2>
      <div className={styles.list}>
        
        {proposals.map((entry) => {
          const {
            proposalId,
            kind,
            userVote,
            yesVotes,
            noVotes,
            minVotes,
            isExecutable,
            expiresIn,
            issuer,
            executed,
          } = processProposal(entry, votes, address, expirationTime)

          return (
            <div key={entry.id} className={styles.card}>
              <p><strong>ID:</strong> {proposalId}</p>
              <p><strong>Kind:</strong> {kind}</p>
              <p><strong>Issuer:</strong> {issuer}</p>
              <p><strong>Votes:</strong> ✅ {yesVotes} / ❌ {noVotes} (Min: {minVotes})</p>
              <p><strong>Expires In:</strong> {expiresIn}</p>
              <p><strong>Status:</strong> {executed ? '✅ Executed' : '⏳ Pending'}</p>
              <p><strong>Your Vote:</strong> {
                userVote === true ? '✅ Yes' :
                userVote === false ? '❌ No' :
                '❓ Not Voted'
              }</p>
              <div className={styles.button_group}>
                <Button
                  shadow_box
                  fit
                  disabled={!address}
                  onClick={() => voteOnProposal(proposalId, true)}
                  className={userVote === true ? styles.active : ''}
                >
                  ✅ Vote Yes
                </Button>
                <Button
                  shadow_box
                  fit
                  disabled={!address}
                  onClick={() => voteOnProposal(proposalId, false)}
                  className={userVote === false ? styles.active : ''}
                >
                  ❌ Vote No
                </Button>
              </div>
              {isExecutable && (
                <Button
                  shadow_box
                  fit
                  onClick={() => executeProposal(proposalId)}
                >
                  ✅ Execute Proposal
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
