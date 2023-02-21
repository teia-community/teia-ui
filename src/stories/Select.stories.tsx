import { Select, ThemeSelection } from '@atoms/select'
import { LANGUAGES_OPTIONS } from '@constants'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Title,
  Subtitle,
  Description,
  Primary,
  ArgsTable,
  // Stories,
  PRIMARY_STORY,
} from '@storybook/addon-docs'
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import React from 'react'

const meta: Meta<typeof Select> = {
  title: 'Atoms/Select',
  component: Select,
  tags: ['autodocs'],

  argTypes: {},
  // parameters: {
  //   docs: {
  //     page: () => (
  //       <>
  //         <Title />
  //         <Subtitle />
  //         <Description />
  //         <Primary />
  //         <ArgsTable story={PRIMARY_STORY} />
  //         Check the other stories in the sidebar for examples
  //         {/* <Stories /> */}
  //       </>
  //     ),
  //   },
  // },
}

export default meta
type Story = StoryObj<typeof Select>

export const Base: Story = {
  decorators: [
    (Story, context) => (
      <div>
        <p>This select has search enabled. This is powered by react-select</p>
        <Story />
      </div>
    ),
  ],
  args: {
    options: LANGUAGES_OPTIONS,
    search: true,
  },
}
export const Themes = {
  render: () => <ThemeSelection apply />,
}
