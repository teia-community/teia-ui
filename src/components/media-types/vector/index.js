import React, { useContext } from 'react'
import classnames from 'classnames'
import { TeiaContext } from '../../../context/TeiaContext'
import styles from '@style'
import './index.css'

export const VectorComponent = ({
  artifactUri,
  previewUri,
  artistAddress,
  objktID,
  onDetailView,
  preview,
  displayView,
}) => {
  const context = useContext(TeiaContext)
  const classes = classnames({
    [styles.container]: true,
    [styles.interactive]: onDetailView,
    [styles.display]: displayView,
  })

  let _viewer_ = false
  let _objkt_ = false

  if (context.address?.address) {
    _viewer_ = context.address.address
  }

  if (objktID) {
    _objkt_ = objktID
  }

  const path = preview
    ? previewUri
    : `${artifactUri}?creator=${artistAddress}&viewer=${_viewer_}&objkt=${_objkt_}`

  return displayView ? (
    <div className={classes}>
      <iframe
        title={`SVG object ${objktID}`}
        src={path}
        sandbox="allow-scripts"
        scrolling="no"
      />
    </div>
  ) : (
    <div className={`${classes} vector-container`}>
      <iframe
        className={`${styles.vector} vector`}
        title={`SVG object ${objktID}`}
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
