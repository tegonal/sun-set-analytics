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
      type: 'group',
      name: 'energy',
      fields: [
        {
          type: 'number',
          name: 'measured_production',
          admin: {
            description: 'Energy produced in kWh',
          },
        },
        {
          type: 'number',
          name: 'estimated_max_production',
          required: false,
          admin: {
            description:
              'Estimated max production data in kWh for the given location and within the provided time window',
          },
        },
        {
          type: 'number',
          name: 'estimated_loss',
          min: 0,
          max: 100,
          required: false,
          admin: {
            description:
              'Estimated loss of pv production data due to weather conditions as percentag (0-100%)',
          },
        },
      ],
    },
  ],
}
