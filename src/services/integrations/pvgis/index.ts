import { Installation } from '@/payload-types'
import { EstimatedProductionProviderService, HourlyProductionData } from '..'
import ky from 'ky'
import { addHours, parse } from 'date-fns'

export const PVGIS_PROVIDER_SERVICE = 'pvgis'

export class PVGISProductionProviderService implements EstimatedProductionProviderService {
  async fetchEstimatedProductionData(
    installation: Installation,
    from: Date,
    to: Date,
  ): Promise<HourlyProductionData | undefined> {
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
      // https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/pvgis-user-manual_en
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
      return new HourlyProductionData(
        PVGIS_PROVIDER_SERVICE,
        result.outputs.hourly.map((entry) => {
          // expected time format i.e.: '20170101:0010'
          const date = parse(entry.time, 'yyyyMMdd:HHmm', new Date())
          return {
            startTime: date.getTime(),
            endTime: addHours(date, 1).getTime(),
            value_watts_per_hour: entry.P,
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
            hourly: a.outputs.hourly.map((item, i) => {
              return {
                time: item.time,
                P: item.P + b.outputs.hourly[i].P,
              }
            }),
          },
        }
      }
    })
    return enrich(mergedResult)
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
