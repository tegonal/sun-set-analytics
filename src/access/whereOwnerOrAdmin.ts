import { Access } from 'payload'
import { ROLE_SUPER_ADMIN } from '@/utilities/constants'

export const isOwner = ({ req: { user } }) => {
  return {
    owner: {
      equals: user?.id,
    },
  }
}
export const isOwnerOfReferencedInstallation: Access = ({ req }) => {
  return {
    'installation.owner': { equals: req.user?.id },
  }
}

export const isOwnerOfReferencedInstallationCreate: Access = async ({ req, data }) => {
  //if (!id) {
  //    return true
  //}

  console.debug('installation:', data)

  if (!data || !data.installation) {
    return false
  }

  // Query another Collection using the `id`
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

export const isAdmin = ({ req: { user } }) => {
  if (user?.role === ROLE_SUPER_ADMIN) {
    return true
  }
  return false
}
