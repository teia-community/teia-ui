import { useState, useEffect, Fragment } from 'react'
import { groupShareTotal, validAddress } from '@utils/collab'
import { Container } from '@atoms/layout'
import { CollaboratorTable, BeneficiariesUI } from '@components/collab'
import AddCollaboratorsButton from '@components/collab/create/AddCollaboratorsButton'
import { ReviewStage } from '@components/collab/create/ReviewStage'
import styles from '@style'
import classNames from 'classnames'
import { Button, Secondary } from '@atoms/button'
import { useUserStore } from '@context/userStore'

export const CreateCollaboration = () => {
  const address = useUserStore((st) => st.address)

  // Core collaborators and beneficiaries
  const [editCollaborators, setEditCollaborators] = useState(true)
  const [collaborators, setCollaborators] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])

  // For adding people not directly involved with the creation
  const [showBeneficiariesUI, setShowBeneficiariesUI] = useState(false)

  // For adding people not directly involved with the creation
  const [showReview, setShowReview] = useState(false)

  // Grand total of share allocation
  const totalShares =
    groupShareTotal(collaborators) + groupShareTotal(beneficiaries)

  // Check for completed entries - must have a share allocation and address
  const validCollaborators = collaborators.filter(
    (c) => !!c.shares && validAddress(c.address)
  )

  useEffect(() => {
    if (beneficiaries.length === 0) {
      setShowBeneficiariesUI(false)
    }
  }, [showReview, beneficiaries.length])

  // Show the beneficiaries UI if we are done editing core collaborators
  useEffect(() => {
    if (!editCollaborators && !showBeneficiariesUI) {
      setShowBeneficiariesUI(true)
    }

    if (validCollaborators.length === 0) {
      setCollaborators([])
    }
  }, [editCollaborators, showBeneficiariesUI, validCollaborators.length])

  // When the user clicks a percentage button in the beneficiaries UI
  const _calculateShares = (index, percentage) => {
    const benefactor = beneficiaries[index]
    const updatedBeneficiaries = [...beneficiaries]

    console.debug('_calculateShares', index, percentage)

    updatedBeneficiaries[index] = {
      ...benefactor,
      shares: Math.ceil((totalShares * percentage) / 100),
    }

    // Now what's left?
    const remaining = totalShares - groupShareTotal(updatedBeneficiaries)

    // Redistribute to collaborators
    const updatedCollaborators = collaborators.map((collaborator) => {
      const proportion = collaborator.shares / groupShareTotal(collaborators)
      const newAllocation = Math.floor(proportion * remaining * 100) / 100

      return {
        ...collaborator,
        shares: newAllocation,
      }
    })

    setBeneficiaries(updatedBeneficiaries)
    setCollaborators(updatedCollaborators)
  }

  const totalParticipants = validCollaborators.length + beneficiaries.length
  const notesClass = classNames(styles.mb2, styles.muted)
  const minimalView = !editCollaborators && (showBeneficiariesUI || showReview)
  const showCollaboratorsTable =
    editCollaborators || validCollaborators.length > 0

  if (!address) {
    return (
      <Container>Please sync your wallet to create a collaboration</Container>
    )
  }

  return showReview ? (
    <ReviewStage
      collaborators={validCollaborators}
      beneficiaries={beneficiaries}
      onEdit={() => setShowReview(false)}
    />
  ) : (
    <Container>
      <h1 className={showCollaboratorsTable ? styles.mb1 : styles.mb2}>
        <strong>Core collaborators</strong>
      </h1>

      {showCollaboratorsTable && (
        <Fragment>
          <p className={notesClass}>
            Note: shares don’t have to add up to 100% - splits are calculated as
            proportions of the total shares.
          </p>
          <p className={notesClass}>
            You can paste multiple addresses to get an auto split
          </p>
        </Fragment>
      )}

      {showCollaboratorsTable && (
        <CollaboratorTable
          collaborators={editCollaborators ? collaborators : validCollaborators}
          setCollaborators={setCollaborators}
          minimalView={minimalView}
          onEdit={() => setEditCollaborators(true)}
        />
      )}

      {!showCollaboratorsTable && (
        <p className={styles.muted}>
          <Button onClick={() => setEditCollaborators(true)}>
            <Secondary>No core collaborators - click to add</Secondary>
          </Button>
        </p>
      )}

      {!minimalView && (
        <AddCollaboratorsButton
          threshold={0}
          collaborators={collaborators}
          onClick={() => setEditCollaborators(false)}
        />
      )}

      {showBeneficiariesUI && (
        <BeneficiariesUI
          totalParticipants={totalParticipants}
          totalShares={totalShares}
          beneficiaries={beneficiaries}
          setBeneficiaries={setBeneficiaries}
          minimalView={showReview}
          onComplete={() => setShowReview(true)}
          onSelectPercentage={(index, percentage) =>
            _calculateShares(index, percentage)
          }
        />
      )}
    </Container>
  )
}
