import { Access } from 'payload'
import { ROLE_SUPER_ADMIN } from '@/utilities/constants'

<<<<<<< Updated upstream
export const whereOwnerOrAdmin = ({ req:{ user }  }) => {
  if (user?.role === ROLE_SUPER_ADMIN) {
    return true;
  }

  console.log (user);
  return { owner: {
    equals: user?.id,
  },
  }
};

export const whereAdmin = ({ req : { user } }) => {
  if (user?.role === ROLE_SUPER_ADMIN) {
    return true;
  }
  return false;
=======
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
>>>>>>> Stashed changes
}
