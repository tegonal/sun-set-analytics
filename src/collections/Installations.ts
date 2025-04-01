import { locationField } from '@/fields/location'
import type { CollectionConfig } from 'payload'

export const Installations: CollectionConfig = {
  slug: 'installations',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      index: true,
    },
    {
      type: 'text',
      name: 'name',
    },
    locationField,
    {
      type: 'array',
      name: 'panels',
      minRows: 1,
      fields: [
        {
          type: 'number',
          name: 'peak_power',
          min: 0,
          label: 'Peak power (kWp)',
          admin: {
            description:
              'This is the power that the manufacturer declares that the PV array can produce under standard test conditions, which are a constant 1000W of solar irradiance per square meter in the plane of the array, at an array temperature of 25°C. The peak power should be entered in kilowatt-peak (kWp). If you do not know the declared peak power of your modules but instead know the area of the modules (in m2) and the declared conversion efficiency (in percent), you can calculate the peak power as power (kWp) = 1 kW/m2 * area * efficiency / 100.',
          },
        },
        {
          type: 'number',
          name: 'slope',
          min: -90,
          max: 90,
          admin: {
            description:
              'This is the angle of the PV modules from the horizontal plane, for a fixed (non-tracking) mounting.',
          },
        },
        {
          type: 'number',
          name: 'azimuth',
          min: -90,
          max: 90,
          admin: {
            description:
              'The azimuth, or orientation, is the angle of the PV modules relative to the direction due South. -90° is East, 0° is South and 90° is West.',
          },
        },
      ],
    },
  ],
}
