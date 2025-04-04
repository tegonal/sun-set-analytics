import { ROLE_SUPER_ADMIN } from '@/utilities/constants'

export const isOwner = ({ req: { user } }) => {
  return {
    owner: {
      equals: user?.id,
    },
  }
}

export const isAdmin = ({ req: { user } }) => {
  if (user?.role === ROLE_SUPER_ADMIN) {
    return true
  }
  return false
}
