import { Button } from '@atoms/button'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    onClick: { action: 'clicked' },
  },
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
