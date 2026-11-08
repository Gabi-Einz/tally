import { ScreenHeader } from '../../components/ScreenHeader'

export function ComingSoonScreen({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <>
      <ScreenHeader title={title} />
      <p className="px-4 py-10 text-center text-muted">{message}</p>
    </>
  )
}
