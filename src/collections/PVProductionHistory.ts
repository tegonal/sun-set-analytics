import type { CollectionConfig } from 'payload'

export const PVProductionHistory: CollectionConfig = {
  slug: 'pv_production',
  fields: [
    {
      type: 'relationship',
      name: 'installation',
      hasMany: false,
      relationTo: 'installations',
    },
    {
      type: 'row',
      fields: [
        {
          type: 'date',
          name: 'from',
        },
        {
          type: 'date',
          name: 'to',
        },
      ],
    },
    {
      type: 'number',
      name: 'power',
      admin: {
        description: 'Produced power in kWh',
      },
    },
  ],
}
