import { DropDown } from '@atoms/dropdown'
import { useTwemoji } from '@hooks/use-twemoji'
import EventCard from './EventCard'

export const EventMenu = ({ events }) => {
  // the reason we created this wrapper..
  useTwemoji()

  return (
    <DropDown menuID="events" vertical>
      {events &&
        events.map((evt) => {
          return (
            <EventCard event={evt} key={`${evt.title} - ${evt.subtitle}`} />
          )
        })}
    </DropDown>
  )
}
