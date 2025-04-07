import type { CollectionConfig } from 'payload'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/utilities/constants'
import { isAdmin } from '@/access/whereOwnerOrAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Settings',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  auth: {
    useAPIKey: true,
  },
  fields: [
    // Email added by default
    // Add more fields as needed
    {
      type: 'join',
      name: 'installations',
      collection: 'installations',
      on: 'owner',
    },
    {
      type: 'select',
      name: 'role',
      defaultValue: ROLE_USER,
      options: [
        {
          label: 'Admin',
          value: ROLE_SUPER_ADMIN,
        },
        {
          label: 'User',
          value: ROLE_USER,
        },
      ],
    },
  ],
}
