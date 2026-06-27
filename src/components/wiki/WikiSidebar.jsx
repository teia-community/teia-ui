import { NavLink } from 'react-router-dom'
import { PATH } from '@constants'
import styles from '@style'

const TreeNode = ({ node, hiddenIds }) => {
  const isHidden = hiddenIds?.has(node.id)
  return (
    <li className={styles.tree_item}>
      <NavLink
        to={`${PATH.WIKI}/${node.id}`}
        className={({ isActive }) =>
          `${styles.tree_link} ${isActive ? styles.tree_link_active : ''} ${
            isHidden ? styles.tree_link_hidden : ''
          }`
        }
        end
      >
        {node.title}
        {isHidden ? ' (hidden)' : ''}
      </NavLink>
      {node.children.length > 0 && (
        <ul className={styles.tree_children}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} hiddenIds={hiddenIds} />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * Hierarchical wiki navigation, built from each page's IPFS `parent` field
 * (resolved to page ids). `hiddenIds` only carries entries for moderators.
 */
export const WikiSidebar = ({ tree, hiddenIds }) => {
  if (!tree?.length) {
    return <p className={styles.sidebar_empty}>No pages yet.</p>
  }
  return (
    <nav className={styles.sidebar} aria-label="Wiki navigation">
      <ul className={styles.tree_root}>
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} hiddenIds={hiddenIds} />
        ))}
      </ul>
    </nav>
  )
}

export default WikiSidebar
