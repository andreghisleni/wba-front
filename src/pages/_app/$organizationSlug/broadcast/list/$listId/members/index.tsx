import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'

export const Route = createFileRoute(
  '/_app/$organizationSlug/broadcast/list/$listId/members/',
)({
  component: RouteComponent,
  params: z.object({
    listId: z.string(),
  }),
})

function RouteComponent() {
  const { listId } = Route.useParams()

  return (
    <div>Hello "/_app/$organizationSlug/broadcast/list/{listId}/members/"!</div>
  )
}
