import styles from '@style'

export const UnknownComponent = ({ mimeType }) => {
  /*   const [queue, updateQueue] = useState()
  updateQueue(await axios.post(import.meta.env.VITE_GRAPHQL_STATUS).then(res => res.data))
 */
  return (
    <div className={styles.container}>
      <div className={styles.square}>Metadata on queue</div>
    </div>
  )
}

export default UnknownComponent
