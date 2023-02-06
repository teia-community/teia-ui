import { Select, ThemeSelection } from '@atoms/select'
import { LANGUAGES_OPTIONS } from '@constants'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Select> = {
  title: 'Atoms/Select',
  component: Select,
  tags: ['autodocs'],

  argTypes: {},
}

export default meta
type Story = StoryObj<typeof Select>

export const Base: Story = {
  args: {
    options: LANGUAGES_OPTIONS,
    search: true,
  },
}
export const Themes = {
  render: () => <ThemeSelection />,
}
