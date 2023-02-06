import type { Meta, StoryObj } from '@storybook/react'
import { RotatingLogo } from '@atoms/logo'

const meta: Meta<typeof RotatingLogo> = {
  title: 'Atoms/Logo',
  component: RotatingLogo,
  tags: ['autodocs'],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof RotatingLogo>

export const Base: Story = {
  args: {
    seed: 44,
  },
}
