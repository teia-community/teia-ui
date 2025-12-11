import { useState } from 'react'
import { POLLS_CONTRACT } from '@constants'
import { useUserStore } from '@context/userStore'
import { usePollsStore } from '@context/pollsStore'
import { Button, IncrementButtons } from '@atoms/button'
import { Line } from '@atoms/line'
import { SimpleInput } from '@atoms/input'
import { Select } from '@atoms/select'
import { IpfsUploader } from '@components/upload'
import { useStorage, useDaoTokenBalance, usePolls } from '@data/swr'
import styles from '@style'

export default function CreatePolls() {
  // Get all the required polls information
  const [pollsStorage] = useStorage(POLLS_CONTRACT)
  const [, updatePolls] = usePolls(pollsStorage)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const [userTokenBalance] = useDaoTokenBalance(userAddress)

  return (
    <section className={styles.section}>
      <h1 className={styles.section_title}>Create a new poll</h1>

      {userTokenBalance === 0 ? (
        <p>Only DAO members can create new polls.</p>
      ) : (
        <>
          <p>Use this form to create new Teia polls.</p>
          <PollForm callback={updatePolls} />
        </>
      )}
    </section>
  )
}

function PollForm({ callback }) {
  // Set the component state
  const [question, setQuestion] = useState('')
  const [descriptionIpfsCid, setDescriptionIpfsCid] = useState('')
  const [voteWeightMethod, setVoteWeightMethod] = useState('equal')
  const [votePeriod, setVotePeriod] = useState('')
  const [options, setOptions] = useState(['', '', ''])

  // Get the create poll method from the polls store
  const createPoll = usePollsStore((st) => st.createPoll)

  // Define the differnt vote weight methods
  const voteWeightMethods = {
    equal: 'Equal: one wallet, one vote',
    linear: 'Linear: proportional to the amount of TEIA tokens',
    quadratic:
      'Quadratic: proportional to the square root of the amount of TEIA tokens',
  }

  // Define the on change handler
  const handleChange = (index, value) => {
    const newOptions = options.slice()
    newOptions[index] = value
    setOptions(newOptions)
  }

  // Define the on click handler
  const handleClick = (e, increase) => {
    e.preventDefault()
    const newOptions = options.slice()

    if (increase) {
      newOptions.push('')
    } else if (newOptions.length > 1) {
      newOptions.pop()
    }

    setOptions(newOptions)
  }

  // Define the on submit handler
  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanOptions = options
      .map((option) => option.trim())
      .filter((option) => option !== '')

    createPoll(
      question,
      descriptionIpfsCid,
      voteWeightMethod,
      votePeriod,
      cleanOptions,
      callback
    )
  }

  return (
    <form className={styles.poll_form} onSubmit={handleSubmit}>
      <div className={styles.poll_form_fields}>
        <SimpleInput
          type="text"
          label="Poll question"
          placeholder="Write here the question you want to ask"
          minlength={10}
          maxlength={500}
          value={question}
          onChange={setQuestion}
          className={styles.poll_form_field}
        >
          <Line />
        </SimpleInput>

        <IpfsUploader
          label="Poll description (optional)"
          placeholder="Select the file with the poll description"
          value={descriptionIpfsCid}
          onChange={setDescriptionIpfsCid}
          className={styles.poll_form_field}
        >
          <Line />
        </IpfsUploader>

        <Select
          label="Method to use to calculate the vote weight"
          alt="Vote weight method selection"
          value={{
            value: voteWeightMethod,
            label: voteWeightMethods[voteWeightMethod],
          }}
          onChange={(e) => setVoteWeightMethod(e.value)}
          options={Object.entries(voteWeightMethods).map(([value, label]) => ({
            value: value,
            label: label,
          }))}
        >
          <Line />
        </Select>

        <SimpleInput
          type="number"
          label="Poll duration in days"
          placeholder="1"
          min="1"
          max="30"
          step="1"
          value={votePeriod}
          onChange={setVotePeriod}
          className={styles.poll_form_field}
        >
          <Line />
        </SimpleInput>

        <div>
          {options.map((option, index) => (
            <SimpleInput
              key={index}
              type="text"
              label={`Option ${index + 1}`}
              placeholder={'A possible option to vote'}
              minlength={1}
              value={option}
              onChange={(value) => handleChange(index, value)}
              className={styles.poll_form_field}
            >
              <Line />
            </SimpleInput>
          ))}
          <IncrementButtons onClick={handleClick} />
        </div>
      </div>

      <Button shadow_box fit>
        Create poll
      </Button>
    </form>
  )
}
