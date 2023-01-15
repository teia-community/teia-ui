import { DropDown } from '@atoms/dropdown'
import { useTwemoji } from '@hooks/use-twemoji'
import EventCard from './EventCard'

export const EventMenu = ({ events, setOpen }) => {
  // the reason we created this wrapper..
  useTwemoji()

  return (
    <DropDown setOpen={setOpen} menuID="events" vertical>
      {events?.map((evt) => {
        return <EventCard event={evt} key={`${evt.title} - ${evt.subtitle}`} />
      })}
    </DropDown>
  )
}
