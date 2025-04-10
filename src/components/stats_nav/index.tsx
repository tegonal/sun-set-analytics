import { Link } from '@payloadcms/ui'

export default function CustomLink() {
  return (
    <nav>
      <Link className="nav__link" href="/admin/statistics">
        Statistic Dashboard
      </Link>
    </nav>
  )
}
