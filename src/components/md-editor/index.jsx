import { lazy } from 'react'
import rehypeSanitize from 'rehype-sanitize'

// Loaded lazily: the editor is heavy and only needed on authoring pages.
// Callers wrap it in their own <Suspense>.
const Editor = lazy(() => import('@uiw/react-md-editor'))

export default function MDEditor({ previewOptions = {}, ...props }) {
  return (
    <Editor
      {...props}
      previewOptions={{
        ...previewOptions,
        rehypePlugins: [
          [rehypeSanitize],
          ...(previewOptions.rehypePlugins || []),
        ],
      }}
    />
  )
}
