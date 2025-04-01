import { PvProduction } from '@/payload-types'
import { format } from 'path'
import { addDataAndFileToRequest, type CollectionConfig, type PayloadRequest } from 'payload'

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
              'Estimated loss of pv production data due to weather conditions as percentage (0-100%)',
          },
        },
      ],
    },
  ],
}

export type PVProductionImport = {
  measured_production: MeasuredProductionData[]
}

export type MeasuredProductionData = {
  from: string
  to: string
  production: number
}

export type ParsedMeasuredProductionData = {
  from: Date
  to: Date
  production: number
}

export async function importPVProductionData(
  installationId: number,
  req: PayloadRequest,
): Promise<Response> {
  await addDataAndFileToRequest(req)
  if (req.json) {
    console.debug('import data for installation', installationId)
    const data: PVProductionImport = await req.json()

    if (!data || !data.measured_production || data.measured_production.length === 0) {
      return Response.json(
        { error: 'At least one measured production entry required' },
        { status: 400 },
      )
    }

    const parseEntries = data.measured_production.map((entry) => {
      const parsed: ParsedMeasuredProductionData = {
        from: new Date(entry.from),
        to: new Date(entry.to),
        production: entry.production,
      }
      return parsed
    })

    parseEntries.forEach((entry, index) => {
      if (entry.from.getTime() >= entry.to.getTime()) {
        return Response.json(
          { error: `Import validation failed on row [${index}]: invalid date range` },
          { status: 400 },
        )
      }
    })

    const earliestFrom = parseEntries
      .map((x) => x.from)
      .sort((a, b) => a.getTime() - b.getTime())[0]
    const latestTo = parseEntries.map((x) => x.to).sort((a, b) => b.getTime() - a.getTime())[0]

    const installation = await req.payload.findByID({
      id: installationId,
      collection: 'installations',
    })

    // TODO: enricht with external sources

    const results = parseEntries.map(async (row) => {
      const data: Omit<PvProduction, 'id' | 'createdAt' | 'updatedAt'> = {
        installation: installation,
        from: row.from.toISOString(),
        to: row.to.toISOString(),
        energy: {
          measured_production: row.production,
          // TODO: add enriched data
        },
      }

      console.debug('import row', data)

      await req.payload.create({
        req,
        collection: 'pv_production',
        data: data,
      })
    })
    await Promise.all(results)

    // TODO: re-calculate monthly stats for the fiven date range

    return Response.json({ status: 'Ok' })
  } else {
    return Response.error()
  }
}
