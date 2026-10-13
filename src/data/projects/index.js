import projects from '@data/projects/projects.json'

export const filters = {
  active: 'Active',
  'open-calls': 'Open Calls',
  completed: 'Completed',
}
export const statusLabels = {
  planning: 'Planning',
  active: 'In progress',
  completed: 'Completed',
}
export function filterProjects(items, filter) {
  if (filter === 'completed')
    return items.filter((p) => p.status === 'completed')
  const active = items.filter((p) => p.status !== 'completed')
  return filter === 'open-calls'
    ? active.filter((p) => p.needs.some((n) => n.open))
    : active
}
export default projects
