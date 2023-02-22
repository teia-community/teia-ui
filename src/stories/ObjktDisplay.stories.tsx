import { FeedItem } from '@components/feed-item/index'
import { ItemInfo } from '@components/item-info'
import { RenderMediaType } from '@components/media-types'
import { fetchObjktDetails } from '@data/api'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof RenderMediaType> = {
  title: 'Components/RenderMediaType',
  component: RenderMediaType,

  tags: ['autodocs'],

  argTypes: {},
}

const Decorator = (Story, context) => {
  const nft = context.loaded.data

  return (
    <>
      <div>
        <Story />
      </div>
      {/* {nft && <ItemInfo nft={nft} />} */}
    </>
  )
}

export default meta
type Story = StoryObj<typeof RenderMediaType>

export const Image: Story = {
  render: (args, { loaded: { data } }) => (
    <RenderMediaType nft={data} displayView />
  ),
  decorators: [Decorator],
  loaders: [
    async () => ({
      data: await fetchObjktDetails('683366'),
    }),
  ],
}

export const Glb: Story = {
  render: (args, { loaded: { data } }) => (
    <RenderMediaType nft={data} displayView />
  ),
  decorators: [Decorator],
  loaders: [
    async () => ({
      data: await fetchObjktDetails('809877'),
    }),
  ],
}
export const Video: Story = {
  render: (args, { loaded: { data } }) => (
    <RenderMediaType nft={data} displayView />
  ),
  decorators: [Decorator],
  loaders: [
    async () => ({
      data: await fetchObjktDetails('812969'),
    }),
  ],
}
export const Interactive: Story = {
  render: (args, { loaded: { data } }) => (
    <RenderMediaType nft={data} displayView />
  ),
  decorators: [Decorator],
  loaders: [
    async () => ({
      data: await fetchObjktDetails('808428'),
    }),
  ],
}
export const Smol: Story = {
  render: (args, { loaded: { data } }) => (
    <RenderMediaType nft={data} displayView />
  ),
  decorators: [Decorator],
  loaders: [
    async () => ({
      data: await fetchObjktDetails('378074'),
    }),
  ],
}
