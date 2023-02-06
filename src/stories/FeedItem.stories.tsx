import { FeedItem } from '@components/feed-item/index'
import { fetchObjktDetails } from '@data/api'
import type { Meta, StoryObj } from '@storybook/react'
import { decorators } from './shared'

const meta: Meta<typeof FeedItem> = {
  title: 'Components/FeedItem',
  component: FeedItem,

  tags: ['autodocs'],

  argTypes: {},

  decorators: [decorators.theme],
}

export default meta
type Story = StoryObj<typeof FeedItem>

export const Image = {
  render: (args, { loaded: { data } }) => <FeedItem nft={data} />,
  loaders: [
    async () => ({
      data: await fetchObjktDetails('683366'),
    }),
  ],
}
export const Glb = {
  render: (args, { loaded: { data } }) => <FeedItem nft={data} />,
  loaders: [
    async () => ({
      data: await fetchObjktDetails('809877'),
    }),
  ],
}
export const Interactive = {
  render: (args, { loaded: { data } }) => <FeedItem nft={data} />,
  loaders: [
    async () => ({
      data: await fetchObjktDetails('808428'),
    }),
  ],
}
export const Smol = {
  render: (args, { loaded: { data } }) => <FeedItem nft={data} />,
  loaders: [
    async () => ({
      data: await fetchObjktDetails('378074'),
    }),
  ],
}
