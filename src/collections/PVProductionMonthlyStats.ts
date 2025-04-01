import type { CollectionConfig } from 'payload'

export const PVProductionMonthlyStats: CollectionConfig = {
  slug: 'pv_production_monthly_stats',
  labels: {
    singular: 'PV production monthly statistic',
    plural: 'PV production monthly stats',
  },
  admin: {
    group: 'Statistics',
    hidden: true,
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
          type: 'number',
          min: 2000,
          max: 2025,
          index: true,
          name: 'year',
        },
        {
          type: 'number',
          name: 'month',
          min: 1,
          max: 12,
          index: true,
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
            description: 'measured production data kWh',
          },
        },
        {
          type: 'number',
          name: 'normalized_production',
          admin: {
            description: 'normalized production data kWh',
          },
        },
      ],
    },
  ],
}
