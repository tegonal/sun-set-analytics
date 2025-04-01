import type { Field } from 'payload'

export const locationField: Field = {
  type: 'row',
  fields: [
    {
      type: 'number',
      name: 'longitude',
      required: false,
    },
    {
      type: 'number',
      name: 'latitude',
      required: false,
    },
  ],
}
