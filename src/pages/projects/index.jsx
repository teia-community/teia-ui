import { Link, useSearchParams } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import projects, { filters, filterProjects, statusLabels } from '@data/projects'
import styles from '@style'

export default function Projects() {
  const [params] = useSearchParams()
  const requested = params.get('view')
  const view = Object.hasOwn(filters, requested) ? requested : 'active'
  const visible = filterProjects(projects, view)
  return (
    <Page title="Community Projects">
      <Container large>
        <div className={styles.projects}>
          <header>
            <h1>Projects</h1>
            <p>Community projects, initiatives and ways to contribute.</p>
            <p>
              Discover what people are building and how you can take part. Find
              upcoming dates in the <Link to="/calendar">Calendar</Link>.
            </p>
          </header>
          <nav className={styles.filters} aria-label="Project views">
            {Object.entries(filters).map(([key, label]) => (
              <Link
                key={key}
                to={key === 'active' ? '/projects' : `/projects?view=${key}`}
                aria-current={view === key ? 'page' : undefined}
              >
                {label} <span>({filterProjects(projects, key).length})</span>
              </Link>
            ))}
          </nav>
          <section aria-label={`${filters[view]} projects`}>
            {visible.length ? (
              <ul className={styles.cards}>
                {visible.map((project) => (
                  <li key={project.slug} className={styles.card}>
                    <p className={styles.meta}>
                      {statusLabels[project.status]}
                    </p>
                    <h2>
                      <Link to={`/projects/${project.slug}`}>
                        {project.title}
                      </Link>
                    </h2>
                    <p>{project.summary}</p>
                    <p className={styles.meta}>
                      Initiated by {project.initiator.name} ·{' '}
                      {project.contributors.length} contributors
                    </p>
                    {project.status !== 'completed' &&
                      project.needs.some((need) => need.open) && (
                        <p>
                          Open call:{' '}
                          {project.needs
                            .filter((need) => need.open)
                            .map((need) => need.title)
                            .join(', ')}
                        </p>
                      )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                <h2>
                  {view === 'open-calls'
                    ? 'No open calls yet'
                    : view === 'completed'
                    ? 'No completed projects yet'
                    : 'No active projects yet'}
                </h2>
                <p>
                  Community projects will appear here as they are added. Start a
                  conversation in{' '}
                  <Link to="/publicchannels">Public Channels</Link> to share an
                  initiative or find collaborators.
                </p>
              </div>
            )}
          </section>
        </div>
      </Container>
    </Page>
  )
}
