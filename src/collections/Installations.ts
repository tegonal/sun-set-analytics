import type { CollectionConfig } from 'payload'
import {
  importPVProductionData,
  recalculateEstimatedProductionForTimeWindow,
} from './PVProductionHistory'
import { recalculateStatisticsForTimeWindow } from './PVProductionMonthlyStats'
import { parseISO } from 'date-fns'
import { isOwner } from '@/access/whereOwnerOrAdmin'

export const Installations: CollectionConfig = {
  slug: 'installations',
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
  },
  access: {
    read: isOwner,
    create: isOwner,
    update: isOwner,
    delete: isOwner,
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
      unique: true,
      required: true,
    },
    {
      type: 'point',
      name: 'location',
    },
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
        {
          type: 'number',
          name: 'system_loss',
          defaultValue: 14,
          min: 0,
          max: 100,
          admin: {
            description:
              'The estimated system losses are all the losses in the system, which cause the power actually delivered to the electricity grid to be lower than the power produced by the PV modules. There are several causes for this loss, such as losses in cables, power inverters, dirt (sometimes snow) on the modules and so on. Over the years the modules also tend to lose a bit of their power, so the average yearly output over the lifetime of the system will be a few percent lower than the output in the first years.',
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'PVGIS_config',
      label: 'PVGIS integration',
      fields: [
        {
          type: 'checkbox',
          name: 'enabled',
          defaultValue: true,
        },
        {
          type: 'select',
          name: 'radiation_database',
          defaultValue: 'PVGIS-SARAH3',
          options: [
            {
              value: 'PVGIS-SARAH3',
              label: 'PVGIS-SARAH3',
            },
            {
              value: 'PVGIS-ERA5',
              label: 'PVGIS-ERA5',
            },
          ],
        },
        {
          type: 'select',
          name: 'mounting_type',
          defaultValue: '0',
          options: [
            {
              value: '0',
              label: 'Fixed',
            },
            {
              value: '3',
              label: 'Vertical axis',
            },
            {
              value: '5',
              label: 'Inclined axis',
            },
            {
              value: '2',
              label: 'Two axis',
            },
          ],
        },
        {
          type: 'select',
          name: 'pv_technology',
          defaultValue: 'crystSi',
          options: [
            {
              value: 'crystSi',
              label: 'Crystalline silicon',
            },
            {
              value: 'CIS',
              label: 'CIS',
            },
            {
              value: 'CdTe',
              label: 'CdTe',
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'open_meteo_config',
      label: 'Open-Meteo integration',
      fields: [
        {
          type: 'checkbox',
          name: 'enabled',
          defaultValue: true,
        },
      ],
    },
  ],
  endpoints: [
    {
      method: 'post',
      path: '/:id/import-production-data',
      handler: async (req) => {
        if (!req.routeParams?.id) {
          return Response.json({ error: `Missing installation id in path` }, { status: 400 })
        }
        if (!req.user?.id) {
          return Response.json({ error: `Missing user in the request` }, { status: 400 })
        }

        const user = await req.payload.findByID({
          collection: 'users',
          id: req.user?.id as number,
        })
        const installation = await req.payload.findByID({
          collection: 'installations',
          id: req.routeParams?.id as number,
        })

        if (typeof installation.owner !== 'number' && installation.owner.id === user.id) {
          return importPVProductionData(req, req.routeParams?.id as number)
        } else {
          return Response.json({ error: 'You have no permission' }, { status: 403 })
        }
      },
    },
    {
      method: 'post',
      path: '/:id/recalculate-monthly-stats',
      handler: async (req) => {
        const user = await req.payload.findByID({
          collection: 'users',
          id: req.user?.id as number,
        })
        const installation = await req.payload.findByID({
          collection: 'installations',
          id: req.routeParams?.id as number,
        })

        if (!req.routeParams?.id) {
          return Response.json({ error: `Missing installation id in path` }, { status: 400 })
        }

        const fromParam = req.searchParams?.get('from')
        if (!fromParam) {
          return Response.json({ error: `Missing 'from' query parameter` }, { status: 400 })
        }
        const toParam = req.searchParams?.get('to')
        if (!toParam) {
          return Response.json({ error: `Missing 'to' query parameter` }, { status: 400 })
        }

        const from = parseISO(fromParam)
        const to = parseISO(toParam)

        if (typeof installation.owner !== 'number' && installation.owner.id === user.id) {
          return recalculateStatisticsForTimeWindow(req, req.routeParams?.id as number, from, to)
        } else {
          return Response.json({ error: 'You have no permission' }, { status: 403 })
        }
      },
    },
    {
      method: 'post',
      path: '/:id/recalculate-estimated-production',
      handler: async (req) => {
        // TODO: add authorization check

        if (!req.routeParams?.id) {
          return Response.json({ error: `Missing installation id in path` }, { status: 400 })
        }

        const fromParam = req.searchParams?.get('from')
        if (!fromParam) {
          return Response.json({ error: `Missing 'from' query parameter` }, { status: 400 })
        }
        const toParam = req.searchParams?.get('to')
        if (!toParam) {
          return Response.json({ error: `Missing 'to' query parameter` }, { status: 400 })
        }

        const from = parseISO(fromParam)
        const to = parseISO(toParam)

        return recalculateEstimatedProductionForTimeWindow(
          req,
          req.routeParams?.id as number,
          from,
          to,
        )
      },
    },
  ],
}
