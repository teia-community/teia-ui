import type { Meta, StoryObj } from '@storybook/react'
import DropdownButton from '@atoms/dropdown/DropdownButton'
import { EventIcon } from '@icons/index'
import { DropDown } from '@atoms/dropdown/index'
import { sample_events } from '@components/header/sample_events'

const meta: Meta<typeof DropDown> = {
  title: 'Atoms/Dropdown',
  component: DropDown,
  tags: ['autodocs'],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof DropDown>

export const Base: Story = {
  render: ({}) => (
    <DropdownButton
      alt={'example dropdown'}
      icon={<EventIcon />}
      menuID="events"
      label={'A sample dropdown with an Icon'}
    >
      {/* <EventMenu events={sample_events} /> */}
      <DropDown menuID="events" vertical>
        {sample_events?.map((evt) => (
          <div>
            <h3>{evt.title}</h3>
            <p>{evt.subtitle}</p>
          </div>
        ))}
      </DropDown>
    </DropdownButton>
  ),
}
