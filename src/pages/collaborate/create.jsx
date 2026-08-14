import { useState, useEffect, useRef, Fragment } from 'react'
import { groupShareTotal, validAddress } from '@utils/collab'
import { Container } from '@atoms/layout'
import {
  CollaboratorTable,
  BeneficiariesUI,
  collaboratorTemplate,
} from '@components/collab'
import AddCollaboratorsButton from '@components/collab/create/AddCollaboratorsButton'
import { ReviewStage } from '@components/collab/create/ReviewStage'
import styles from '@style'
import classNames from 'classnames'
import { Button, Secondary } from '@atoms/button'
import { useUserStore } from '@context/userStore'
import { COLLECTIONS_DAO_FEE_PERCENT } from '@constants'

export const CreateCollaboration = ({ isCollection = false }) => {
  const address = useUserStore((st) => st.address)
  const sync = useUserStore((st) => st.sync)

  // Core collaborators and beneficiaries.
  // Collections pre-fill the connected wallet as a collaborator.
  // Address only, shares left blank
  const [editCollaborators, setEditCollaborators] = useState(true)
  const [collaborators, setCollaborators] = useState(() =>
    isCollection && address ? [{ ...collaboratorTemplate, address }] : []
  )
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

  // Seed the default collaborator when the wallet connects after mount
  const seededDefault = useRef(isCollection && Boolean(address))
  useEffect(() => {
    if (isCollection && address && !seededDefault.current) {
      seededDefault.current = true
      setCollaborators([{ ...collaboratorTemplate, address }])
    }
  }, [isCollection, address])

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
      // Collections pre-fill the wallet address with blank shares
      const hasSeededAddress =
        isCollection && collaborators.some((c) => validAddress(c.address))
      if (!hasSeededAddress) {
        setCollaborators([])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // On Collections, override the "Core collaborators" to become h2
  const CoreHeading = isCollection ? 'h2' : 'h1'

  if (!address) {
    return (
      <Container>
        <p className={styles.mb2}>
          Sync your wallet to create{' '}
          {isCollection ? 'a collection' : 'a collaboration'}.
        </p>
        <Button shadow_box onClick={() => sync()}>
          Sync wallet
        </Button>
      </Container>
    )
  }

  return showReview ? (
    <ReviewStage
      collaborators={validCollaborators}
      beneficiaries={beneficiaries}
      isCollection={isCollection}
      onEdit={() => setShowReview(false)}
    />
  ) : (
    <Container>
      {isCollection && (
        <Fragment>
          <h1 className={styles.mb1}>
            <strong>Collections Creation</strong>
          </h1>
          <p className={styles.mb2}>
            ⓘ The Teia multisig automatically receives a{' '}
            <strong>{COLLECTIONS_DAO_FEE_PERCENT}%</strong> share of this
            collection to help fund the Teia DAO. No signing required.
          </p>
        </Fragment>
      )}
      <CoreHeading className={showCollaboratorsTable ? styles.mb1 : styles.mb2}>
        <strong>Core collaborators</strong>
      </CoreHeading>

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
