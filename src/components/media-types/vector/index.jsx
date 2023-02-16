import classnames from 'classnames'
import styles from '@style'
import './index.css'
import { useUserStore } from '@context/userStore'

/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const VectorComponent = ({
  artifactUri,
  previewUri,
  displayView,
  nft,
}) => {
  const address = useUserStore((st) => st.address)
  const classes = classnames({
    [styles.container]: true,
    [styles.interactive]: displayView,
    [styles.display]: displayView,
  })

  let _viewer_ = false
  let _objkt_ = false

  if (address) {
    _viewer_ = address
  }

  if (nft.token_id) {
    _objkt_ = nft.token_id
  }

  const path = previewUri
    ? previewUri
    : `${artifactUri}?creator=${nft.artist_address}&viewer=${_viewer_}&objkt=${_objkt_}`

  return displayView ? (
    <div className={classes}>
      <iframe
        title={`SVG object ${nft.token_id}`}
        src={path}
        sandbox="allow-scripts"
        scrolling="no"
      />
    </div>
  ) : (
    <div className={`${classes} vector-container`}>
      <iframe
        className={`${styles.vector} vector`}
        title={`SVG object ${nft.token_id}`}
        src={path}
        sandbox="allow-scripts"
        scrolling="no"
        // onLoad={(o)=>{
        //   console.log(o)
        //   o.target.style.height=o.target.contentWindow.document.body.scrollHeight+"px";
        // }}
        // onLoad={
        // 'javascript:(function(o){o.style.height=o.contentWindow.document.body.scrollHeight+"px";}(this));'
        // }
      />
    </div>
  )
}
// svg version:     src={`${src}?author=${_creator_}&viewer=${_viewer_}`}
// iframe version:  src={`https://teia-community.github.io/teia-ui/gh-pages/sandbox-svg.html?src=${src}&creator=${_creator_}&viewer=${_viewer_}`}

export default VectorComponent
