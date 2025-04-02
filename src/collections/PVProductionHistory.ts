import {
  addDataAndFileToRequest,
  DateFieldValidation,
  type CollectionConfig,
  type PayloadRequest,
} from 'payload'
import { recalculateStatisticsForTimeWindow } from './PVProductionMonthlyStats'
import { isOwner } from '@/access/whereOwnerOrAdmin'
import { PVGISProductionProviderService } from '@/services/integrations/pvgis'
import { ProductionData } from '@/services/integrations'

export const fromToValidation: DateFieldValidation = (val, { data }) => {
  if (!data || !val) {
    return true
  }
  const from = data.from as Date
  if (!from) {
    return true
  }
  if (from > val) {
    return 'To needs to be after from'
  }
  if (val?.getMonth() != from.getMonth() || val?.getFullYear() != from.getFullYear()) {
    return 'To needs to be at least within the same month and year'
  }
  return true
}

export const PVProductionHistory: CollectionConfig = {
  slug: 'pv_production',
  labels: {
    singular: 'PV production history entry',
    plural: 'PV production history entries',
  },
  admin: {
    group: 'Solar data',
  },
  access: {
    read: isOwner,
    create: isOwner,
    update: isOwner,
    delete: isOwner,
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
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          type: 'date',
          name: 'to',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
          //validate: fromToValidation,
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
          name: 'estimated_production',
          required: false,
          admin: {
            description:
              'Estimated production data in kWh for the given location and within the provided time window',
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

function chunks<T>(arr: T[], chunkSize: number) {
  const chunks: T[][] = []
  while (arr.length > 0) {
    const chunk = arr.splice(0, chunkSize)
    chunks.push(chunk)
  }
  return chunks
}

const PRODUCTION_PROVIDER_SERVICES = [new PVGISProductionProviderService()]

const foldl = <A, B>(f: (x: A, acc: B) => B, acc: B, [h, ...t]: A[]): B =>
  h === undefined ? acc : foldl(f, f(h, acc), t)

export async function importPVProductionData(
  req: PayloadRequest,
  installationId: number,
): Promise<Response> {
  await addDataAndFileToRequest(req)
  const pv_production_history = req.payload.db.tables['pv_production']
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

    const productionDataProviders = (
      await Promise.all(
        PRODUCTION_PROVIDER_SERVICES.map(
          async (p) => await p.fetchEstimatedProductionData(installation, earliestFrom, latestTo),
        ),
      )
    ).filter((p) => p !== undefined)

    // insert importe data in chunks
    const batchSize = 100
    const inputChunks = chunks(parseEntries, batchSize)
    console.debug('Prepared chunks')
    await req.payload.db.drizzle.transaction(async (tx) => {
      const futures = inputChunks.map(async (elements) => {
        const importData = elements.map((row) => {
          // finrst estimation by iterating through providers until
          const estimated_production = foldl<ProductionData, Promise<number | undefined>>(
            async (service, result) =>
              (await result)
                ? Promise.resolve(result)
                : await service.calculateForDateRange(row.from, row.to),
            Promise.resolve(undefined),
            productionDataProviders,
          )

          const data = {
            id: null,
            installation: installationId,
            from: row.from.toISOString(),
            to: row.to.toISOString(),
            energy_measured_production: row.production,
            energy_estimated_production: estimated_production,
          }

          return data
        })
        process.stdout.write('.')
        return await tx.insert(pv_production_history).values(importData)
      })
      return await Promise.all(futures)
    })
    process.stdout.write('\n')

    await recalculateStatisticsForTimeWindow(req, installationId, earliestFrom, latestTo)

    return Response.json({ status: 'Ok' })
  } else {
    return Response.error()
  }
}
