import { ROLE_SUPER_ADMIN } from '@/utilities/constants'
import type { PayloadRequest } from 'payload'

export const isOwner = ({ req }: { req: PayloadRequest }) => {
  return {
    owner: {
      equals: req.user?.id,
    },
  }
}

export const isAdmin = ({ req }: { req: PayloadRequest }) => {
  if (req.user?.role === ROLE_SUPER_ADMIN) {
    return true
  }
  return false
}
