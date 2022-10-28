import React, { useContext } from 'react'
import classnames from 'classnames'
import { HicetnuncContext } from '../../../context/HicetnuncContext'
import styles from './styles.module.scss'
import './index.css'

export const VectorComponent = ({
  artifactUri,
  previewUri,
  creator,
  objktID,
  onDetailView,
  preview,
  displayView,
}) => {
  const context = useContext(HicetnuncContext)
  const classes = classnames({
    [styles.container]: true,
    [styles.interactive]: onDetailView,
    [styles.display]: displayView,
  })

  let _creator_ = false
  let _viewer_ = false
  let _objkt_ = false

  if (creator && creator.address) {
    _creator_ = creator.address
  }

  if (context.address && context.address.address) {
    _viewer_ = context.address.address
  }

  if (objktID) {
    _objkt_ = objktID
  }

  let path
  if (preview) {
    // can't pass creator/viewer query params to data URI
    path = previewUri
  } else {
    path = `${artifactUri}?creator=${_creator_}&viewer=${_viewer_}&objkt=${_objkt_}`
  }

  if (displayView) {
    return (
      <div className={classes}>
        <iframe
          title={`SVG object ${objktID}`}
          src={path}
          sandbox="allow-scripts"
          scrolling="no"
        />
      </div>
    )
  } else {
    return (
      <div className={classes + ' vector-container'}>
        <iframe
          className={styles.vector + ' vector'}
          title={`SVG object ${objktID}`}
          src={path}
          sandbox="allow-scripts"
          scrolling="no"
          // onLoad={(o)=>{
          //   console.log(o)
          //   o.target.style.height=o.target.contentWindow.document.body.scrollHeight+"px";
          // }}
          // onLoad={
          // eslint-disable-next-line no-script-url
          // 'javascript:(function(o){o.style.height=o.contentWindow.document.body.scrollHeight+"px";}(this));'
          // }
        />
      </div>
    )
  }
}
// svg version:     src={`${src}?author=${_creator_}&viewer=${_viewer_}`}
// iframe version:  src={`https://hicetnunc2000.github.io/hicetnunc/gh-pages/sandbox-svg.html?src=${src}&creator=${_creator_}&viewer=${_viewer_}`}
