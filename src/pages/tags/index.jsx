/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'
import { useParams } from 'react-router'
import { Page } from '@atoms/layout'
import TagFeed from '@pages/home/feeds/tag-feed'

export const Tags = () => {
  const { tag } = useParams()

  return (
    <Page title={`Tag ${tag}`}>
      <div className="tag-view">
        <TagFeed tag={tag} namespace={`tag_${tag}`} />
      </div>
    </Page>
  )
}
