import { Button } from '@atoms/button'
import type { Meta, StoryObj } from '@storybook/react'
import { decorators } from './shared'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },

  decorators: [decorators.theme],
}

export default meta
type Story = StoryObj<typeof Button>

export const Box: Story = {
  args: {
    box: true,
    shadow_box: false,
    children: 'Box',
  },
}
export const ShadowBox: Story = {
  args: {
    shadow_box: true,
    children: 'Shadow Box',
  },
}
