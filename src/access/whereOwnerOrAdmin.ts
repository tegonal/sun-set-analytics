import { Access, PayloadRequest } from 'payload'
import { ROLE_SUPER_ADMIN } from '@/utilities/constants'

export const isOwner = ({ req }: { req: PayloadRequest }) => {
  return {
    owner: {
      equals: req.user?.id,
    },
  }
}
export const isOwnerOfReferencedInstallation: Access = ({ req }) => {
  return {
    'installation.owner': { equals: req.user?.id },
  }
}

export const isOwnerOfReferencedInstallationCreate: Access = async ({ req, data }) => {
  if (!data || !data.installation) {
    return false
  }

  const result = await req.payload.find({
    collection: 'installations',
    limit: 0,
    depth: 0,
    where: {
      id: { equals: data.installation },
      owner: { equals: req.user?.id },
    },
  })

  return result.totalDocs > 0
}

export const isAdmin = ({ req }: { req: PayloadRequest }) => {
  if (req.user?.role === ROLE_SUPER_ADMIN) {
    return true
  }
  return false
}
