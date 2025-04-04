import { Installation } from '@/payload-types'
import { EstimatedProductionProviderService, HourlyProductionData, ProductionData } from '..'
import ky from 'ky'
import { addHours, format, parseISO } from 'date-fns'

export const OPEN_METEO_PROVIDER_SERVICE = 'open-meteo'

export class OpenMeteoProductionProviderService implements EstimatedProductionProviderService {
  async fetchEstimatedProductionData(
    installation: Installation,
    from: Date,
    to: Date,
  ): Promise<ProductionData | undefined> {
    if (!installation.open_meteo_config?.enabled) {
      // not enabled
      return Promise.resolve(undefined)
    }

    // fetch at most until now
    if (from.getTime() > Date.now()) {
      from = new Date()
    }
    if (to.getTime() > Date.now()) {
      to = new Date()
    }

    const parsedResults = await Promise.all(
      (installation.panels || []).map(async (panel) => {
        const result = await ky
          .get('https://satellite-api.open-meteo.com/v1/archive', {
            headers: {
              'content-type': 'application/json',
            },
            searchParams: {
              longitude: installation.location?.[0]?.toString() || '0',
              latitude: installation.location?.[1]?.toString() || '0',
              start_date: format(from, 'yyyy-MM-dd'),
              end_date: format(to, 'yyyy-MM-dd'),
              // based on: https://arka360.com/ros/solar-irradiance-concepts/
              hourly: 'global_tilted_irradiance',
              timeformat: 'iso8601',
              tilt: panel.slope || 0,
              azimuth: panel.azimuth || 0,
            },
          })
          .json<OpenMeteoResult>()

        return new HourlyProductionData(
          OPEN_METEO_PROVIDER_SERVICE,
          result.hourly.time.map((dateString, index) => {
            const irradiance = result.hourly.global_tilted_irradiance[index]
            const date = parseISO(dateString)

            // simplified calculation of power based on irradiance
            // p (W) = irradiance (Wh) * panel.system_loss * panel.peak_power (kWp)
            const value_watts_per_hour =
              ((irradiance * (100 - (panel.system_loss || 0))) / 100) * (panel.peak_power || 0)

            //console.debug('Calculate value_watt ', dateString, irradiance, value_watts_per_hour)
            return {
              startTime: date.getTime(),
              endTime: addHours(date, 1).getTime(),
              value_watts_per_hour: value_watts_per_hour,
            }
          }),
        )
      }),
    )
    console.debug('fetched open-meteo data')

    if (parsedResults.length === 1) {
      return parsedResults[0]
    }
    // merge results, expect the same number of records
    const mergedResult = parsedResults.reduce((a, b) => {
      if (a.values.length != b.values.length) {
        console.error('expected same number of results')
        return a
      } else {
        return new HourlyProductionData(
          OPEN_METEO_PROVIDER_SERVICE,
          a.values.map((item, i) => {
            return {
              ...item,
              value_watts_per_hour: item.value_watts_per_hour + b.values[i].value_watts_per_hour,
            }
          }),
        )
      }
    })
    return mergedResult
  }
}

interface OpenMeteoResult {
  hourly: {
    time: string[]
    global_tilted_irradiance: number[]
  }
}
