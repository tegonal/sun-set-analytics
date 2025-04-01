import {Access} from 'payload'
import { ROLE_SUPER_ADMIN} from '@/utilities/constants'

export const whereOwnerOrAdmin = ({ req, doc }) => {
  if (req.user?.role === ROLE_SUPER_ADMIN) {
    return true;
  }

  return doc?.owner?.id === req.user?.id;
};

export const whereAdmin = ({ req, doc }) => {
  if (req.user?.role === ROLE_SUPER_ADMIN) {
    return true;
  }

  return false;
}
