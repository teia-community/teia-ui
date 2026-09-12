import { Link, useParams } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import projects, { statusLabels } from '@data/projects'
import styles from '@style'

function ResourceLink({ url, children }) {
  if (typeof url !== 'string' || !/^(https?:\/\/|\/(?!\/))/.test(url))
    return <span>{children}</span>
  return url.startsWith('/') ? (
    <Link to={url}>{children}</Link>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

export default function ProjectDetail() {
  const { slug } = useParams()
  const project = projects.find((item) => item.slug === slug)
  return (
    <Page title={project?.title || 'Project not found'}>
      <Container large>
        <article className={styles.projects}>
          <Link to="/projects">‹ Back to projects</Link>
          {!project ? (
            <>
              <h1>Project not found</h1>
              <p>
                This project may have moved or is not published yet. Browse{' '}
                <Link to="/projects">all projects</Link>.
              </p>
            </>
          ) : (
            <>
              <header>
                <p className={styles.meta}>{statusLabels[project.status]}</p>
                <h1>{project.title}</h1>
                <p>{project.summary}</p>
              </header>
              <p className={styles.description}>{project.description}</p>
              <section className={styles.section}>
                <h2>People</h2>
                <p>
                  Initiated by{' '}
                  <ResourceLink url={project.initiator.url}>
                    {project.initiator.name}
                  </ResourceLink>
                </p>
                <h3>Contributors ({project.contributors.length})</h3>
                {project.contributors.length ? (
                  <ul>
                    {project.contributors.map((person, i) => (
                      <li key={i}>
                        <ResourceLink url={person.url}>
                          {person.name}
                        </ResourceLink>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No contributors listed yet.</p>
                )}
              </section>
              <section className={styles.section}>
                <h2>Ways to contribute</h2>
                {project.status === 'completed' ? (
                  <p>This project is complete. Its calls are closed.</p>
                ) : project.needs.some((need) => need.open) ? (
                  <ul>
                    {project.needs
                      .filter((need) => need.open)
                      .map((need, i) => (
                        <li key={i}>
                          <h3>{need.title}</h3>
                          <p>{need.description}</p>
                          <ResourceLink url={need.url}>
                            Get involved
                          </ResourceLink>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p>No open calls at the moment.</p>
                )}
              </section>
              <section className={styles.section}>
                <h2>Updates</h2>
                {project.updates.length ? (
                  <ol>
                    {[...project.updates]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((update, i) => (
                        <li key={i}>
                          <time dateTime={update.date}>{update.date}</time>
                          <h3>{update.title}</h3>
                          <p className={styles.description}>{update.body}</p>
                        </li>
                      ))}
                  </ol>
                ) : (
                  <p>No updates posted yet.</p>
                )}
              </section>
              <section className={styles.section}>
                <h2>Related events</h2>
                {project.events.length ? (
                  <ul>
                    {project.events.map((event, i) => (
                      <li key={i}>
                        <ResourceLink url={event.url}>
                          {event.title}
                        </ResourceLink>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No related events listed.</p>
                )}
                <p>
                  <Link to="/calendar">Browse the Calendar</Link>
                </p>
              </section>
              {project.links.length > 0 && (
                <section className={styles.section}>
                  <h2>Project links</h2>
                  <ul>
                    {project.links.map((link, i) => (
                      <li key={i}>
                        <ResourceLink url={link.url}>{link.label}</ResourceLink>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </article>
      </Container>
    </Page>
  )
}
