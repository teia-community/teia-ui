import { PATH } from '@constants'
import { Button } from '@atoms/button'
import styles from '@style'

export const Tags = ({ tags }: { tags: string[] }) => {
  return (
    <div className={styles.container}>
      {tags
        .filter((e: string) => e !== '')
        .map((tag, index) => {
          return (
            <Button
              key={`tag${tag}${index}`}
              to={`${PATH.TAGS}/${encodeURI(tag)}`}
            >
              <div className={styles.tag}>{tag}</div>
            </Button>
          )
        })}
    </div>
  )
}
