import { Button } from '@atoms/button'
import { FeedbackComponent } from '@components/feedback'
import { useModalStore } from '@context/modalStore'
import { ArgsTable, PRIMARY_STORY, Title } from '@storybook/blocks'
// import { fetchObjktDetails } from '@data/api'
import type { Meta, StoryObj } from '@storybook/react'

const Decorator = (Story, context) => {
  const [step, show] = useModalStore((st) => [st.step, st.show])

  return (
    <div>
      <Button
        shadow_box
        onClick={async () => {
          step(
            'Example',
            'The body can contain [markdown](https://www.markdownguide.org/)'
          )
          setTimeout(
            () => show('Example', 'Once done you can show a closing dialog 🔥'),
            2500
          )
        }}
      >
        Example
      </Button>
      <Story />
    </div>
  )
}
const meta: Meta<typeof FeedbackComponent> = {
  title: 'Components/FeedbackComponent',
  component: FeedbackComponent,

  tags: ['autodocs'],
  decorators: [Decorator],

  parameters: {
    docs: {
      page: () => (
        <>
          <Title />
          {/* <Subtitle /> */}
          {/* <Description /> */}
          {/* <Primary /> */}
          <ArgsTable story={PRIMARY_STORY} />
          Check the other stories in the sidebar for examples
          {/* <Stories /> */}
        </>
      ),
    },
  },
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof FeedbackComponent>

export const Transactions: Story = {
  render: (args, { loaded: { data } }) => <FeedbackComponent />,
  loaders: [],
}
