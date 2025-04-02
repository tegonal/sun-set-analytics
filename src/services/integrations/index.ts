import { Installation } from '@/payload-types'

export interface EstimatedProductionProviderService {
  fetchEstimatedProductionData(
    installation: Installation,
    from: Date,
    to: Date,
  ): Promise<ProductionData | undefined>
}

export interface ProductionData {
  calculateForDateRange(from: Date, to: Date): Promise<number | undefined>
}

export class HourlyProductionData implements ProductionData {
  values: HourlyProductionDataEntry[]
  constructor(values: HourlyProductionDataEntry[]) {
    this.values = values
  }
  async calculateForDateRange(from: Date, to: Date): Promise<number | undefined> {
    const fromTime = from.getTime()
    const toTime = to.getTime()
    const fetchedValues = this.values
      .map((value) => {
        if (value.startTime >= fromTime && value.endTime <= toTime) {
          // sum all hourly values full included in the time window
          // convert from W to kW
          return value.value_watts_per_hour / 1000
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
          return (value.value_watts_per_hour * factor) / 1000
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

interface HourlyProductionDataEntry {
  // value in Wh
  value_watts_per_hour: number
  startTime: number
  endTime: number
}
