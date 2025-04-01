import type { CollectionConfig } from 'payload'

export const PVProductionHistory: CollectionConfig = {
  slug: 'pv_production',
  labels: {
    singular: 'PV production history entry',
    plural: 'PV production history entries',
  },
  admin: {
    group: 'Solar data',
  },
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
      type: 'row',
      fields: [
        {
          type: 'number',
          name: 'energy',
          admin: {
            description: 'Energy produced in kWh',
          },
        },
        {
          type: 'number',
          name: 'loss',
          min: 0,
          max: 100,
          defaultValue: 0,
          admin: {
            description:
              'Loss of pv production data due to weather conditions as percentag (0-100%)',
          },
        },
      ],
    },
  ],
}
