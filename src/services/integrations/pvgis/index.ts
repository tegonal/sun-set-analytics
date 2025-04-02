import { Installation } from '@/payload-types'
import { EstimatedProductionProviderService, ProductionData } from '..'
import ky from 'ky'
import { addHours, parse } from 'date-fns'

export class PVGISProductionProviderService implements EstimatedProductionProviderService {
  async fetchEstimatedProductionData(
    installation: Installation,
    from: Date,
    to: Date,
  ): Promise<ProductionData | undefined> {
    if (
      !installation.PVGIS_config?.enabled ||
      to.getFullYear() < 2005 ||
      from.getFullYear() > 2023
    ) {
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
    console.debug('fetched PVGIS data')
    const parsedResults: PVGISResult[] = await Promise.all(results)
    if (!parsedResults) {
      return undefined
    }

    const enrich = (result: PVGISResult) => {
      return new PVGISProductionData(
        result.outputs.hourly.map((entry) => {
          // expected time format i.e.: '20170101:0010'
          const date = parse(entry.time, 'yyyyMMdd:HHmm', new Date())
          return {
            startTime: date.getTime(),
            endTime: addHours(date, 1).getTime(),
            P: entry.P,
          }
        }),
      )
    }

    if (parsedResults.length === 1) {
      return enrich(parsedResults[0])
    }
    // merge results, expect the same number of records
    const mergedResult = parsedResults.reduce((a, b) => {
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
    return enrich(mergedResult)
  }
}

class PVGISProductionData implements ProductionData {
  pvgis: PVGISParsedOutput[]
  constructor(pvgis: PVGISParsedOutput[]) {
    this.pvgis = pvgis
  }
  async calculateForDateRange(from: Date, to: Date): Promise<number | undefined> {
    const fromTime = from.getTime()
    const toTime = to.getTime()
    const fetchedValues = this.pvgis
      .map((value) => {
        if (value.startTime >= fromTime && value.endTime <= toTime) {
          // sum all hourly values full included in the time window
          // convert from W to kW
          return value.P / 1000
        }
        if (
          (fromTime >= value.startTime && fromTime <= value.endTime) ||
          (toTime >= value.startTime && toTime <= value.endTime)
        ) {
          // partially included in the time window, calculate proportional value
          // convert from W to kW
          const factor =
            (Math.min(toTime, value.endTime) - Math.max(fromTime, value.startTime)) /
            (value.endTime - value.startTime)
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

interface PVGISParsedOutput {
  P: number
  // enriched information
  startTime: number
  endTime: number
}
