import { Installation, PvProduction } from '@/payload-types'
import { addHours, parse } from 'date-fns'
import ky from 'ky'
import { addDataAndFileToRequest, type CollectionConfig, type PayloadRequest } from 'payload'
import { isOwner } from '@/access/whereOwnerOrAdmin'

export const PVProductionHistory: CollectionConfig = {
  slug: 'pv_production',
  labels: {
    singular: 'PV production history entry',
    plural: 'PV production history entries',
  },
  auth: {
    useAPIKey: true,
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
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      index: true,
    },
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

    // TODO: enrich with external sources
    const pvgisData = installation.PVGIS_config?.enabled
      ? await fetchPVGISData(earliestFrom, latestTo, installation)
      : undefined

    const results = parseEntries.map(async (row) => {
      const estimated_production = pvgisData
        ? // determine measure value
          calculateEstimatedProductionForTimeWindow(row.from.getTime(), row.to.getTime(), pvgisData)
        : undefined

      const data: Omit<PvProduction, 'id' | 'createdAt' | 'updatedAt'> = {
        installation: installation,
        from: row.from.toISOString(),
        to: row.to.toISOString(),
        energy: {
          measured_production: row.production,
          estimated_production: estimated_production,
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

/**
 * Calculate the average estimated production based on the PVGIS result
 * @param from
 * @param to
 * @param pvgis
 */
function calculateEstimatedProductionForTimeWindow(
  from: number,
  to: number,
  pvgis: PVGISResult,
): number | undefined {
  const fetchedValues = pvgis.outputs.hourly
    .map((value) => {
      // expected time format i.e.: '20170101:0010'
      const date = parse(value.time, 'yyyyMMdd:HHmm', new Date())
      const startTime = date.getTime()
      const endTime = addHours(date, 1).getTime()

      if (startTime >= from && endTime <= to) {
        // sum all hourly values full included in the time window
        // convert from W to kW
        return value.P / 1000
      }
      if ((from >= startTime && from <= endTime) || (to >= startTime && to <= endTime)) {
        // partially included in the time window, calculate proportional value
        // convert from W to kW
        const factor = (Math.min(to, endTime) - Math.max(from, startTime)) / (endTime - startTime)
        return (value.P * factor) / 1000
      }
      // no part of the time window
      return undefined
    })
    .filter((a) => a)

  if (fetchedValues.length > 0) {
    return fetchedValues.reduce((a, b) => a! + b!)
  }
  // no valid values found
  return undefined
}

async function fetchPVGISData(
  from: Date,
  to: Date,
  installation: Installation,
): Promise<PVGISResult | undefined> {
  if (to.getFullYear() < 2005 || from.getFullYear() > 2023) {
    // cannot fetch data outside of the available time window
    return Promise.resolve(undefined)
  }

  // PVGIS data only available in between 2005 and 2023
  const startYear = Math.max(2005, Math.min(from.getFullYear(), 2023)).toString()
  const endYear = Math.max(2005, Math.min(to.getFullYear(), 2023)).toString()

  // fetch for all panels
  const results = (installation.panels || []).map(async (panel) => {
    return await ky
      .get('https://re.jrc.ec.europa.eu/api/v5_3/seriescalc', {
        headers: {
          'content-type': 'application/json',
        },
        searchParams: {
          lon: installation.location?.[0]?.toString() || '0',
          lat: installation.location?.[1]?.toString() || '0',
          raddatabase: installation.PVGIS_config?.radiation_database || 'PVGIS-SARAH3',
          select_database_hourly: installation.PVGIS_config?.radiation_database || 'PVGIS-SARAH3',
          outputformat: 'json',
          usehorizon: '1',
          angle: panel.slope || '0',
          hourlyangle: panel.slope || '0',
          apect: panel.azimuth || '0',
          hourlyaspect: panel.azimuth || '0',
          startyear: startYear,
          hstartyear: startYear,
          endyear: endYear,
          hendyear: endYear,
          moingintplace: 'free',
          optimalinclination: '0',
          optimalangles: '0',
          trackingtype: installation.PVGIS_config?.mounting_type || '0',
          pvcalculation: '1',
          pvtechchoice: installation.PVGIS_config?.pv_technology || 'crystSi',
          peakpower: panel.peak_power || '0',
          loss: panel.system_loss || '0',
          components: '1',
        },
      })
      .json<PVGISResult>()
  })
  const parsedResults: PVGISResult[] = await Promise.all(results)
  if (!parsedResults) {
    return undefined
  }
  if (parsedResults.length === 1) {
    return parsedResults[0]
  }
  // merge results, expect the same number of records
  parsedResults.reduce((a, b) => {
    if (a.outputs.hourly.length != b.outputs.hourly.length) {
      console.error('expected same number of results')
      return a
    } else {
      return {
        outputs: {
          hourly: a.outputs.hourly.map((item, i) => Object.assign({}, item, b.outputs.hourly[i])),
        },
      }
    }
  })
}

interface PVGISResult {
  outputs: {
    hourly: PVGISOutput[]
  }
}

interface PVGISOutput {
  time: string
  P: number
}
