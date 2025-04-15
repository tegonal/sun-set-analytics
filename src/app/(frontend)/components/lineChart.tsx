'use client'

import { PvProductionMonthlyStat } from '@/payload-types'
import * as Plot from '@observablehq/plot'
import ky from 'ky'
import { useEffect, useRef, useState } from 'react'
import { ChartSettings } from './chartSettings'

interface PlotData {
  date: Date
  year: string
  month: number
  estimated_production: number | null
  measured_production: number | null
  diff_production: number | null
  ratio_production: number | null
}
interface AnalysisType {
  name: string
  title: string
  plot: (data: PlotData[], stacked: boolean) => Plot.Markish[]
}

export interface PlotView {
  installationId: number | null
  analysisType: AnalysisType
  stackYears: boolean
}

interface MonthlyStatsResult {
  docs: PvProductionMonthlyStat[]
}

const formatNumber = (d: number) =>
  Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(d)

export const analysisTypes: AnalysisType[] = [
  {
    name: 'estimated_vs_measured_1',
    title: 'Measured vs. Estimated Production [kWh]',
    plot: (data, stacked) => {
      if (stacked) {
        return [
          Plot.barY(data, {
            x: 'year',
            y: 'measured_production',
            fill: 'year',
            fx: 'month',
            channels: {
              measured_production: 'measured_production',
              estimated_production: 'estimated_production',
            },
            tip: {
              format: {
                x: true,
                fx: true,
                measured_production: (d) => `${formatNumber(d)} kWh`,
                estimated_production: (d) => `${formatNumber(d)} kWh`,
              },
            },
          }),
          Plot.barY(data, {
            x: 'year',
            y: 'estimated_production',
            stroke: 'black',
            fx: 'month',
          }),
        ]
      }
      return [
        Plot.ruleY([0]),
        Plot.differenceY(data, {
          x: 'date',
          y1: 'estimated_production',
          y2: 'measured_production',
          curve: 'step-after',
          channels: {
            measured_production: 'measured_production',
            estimated_production: 'estimated_production',
          },
          tip: {
            format: {
              x: true,
              measured_production: (d) => `${formatNumber(d)} kWh`,
              estimated_production: (d) => `${formatNumber(d)} kWh`,
            },
          },
        }),
      ]
    },
  },
  {
    name: 'estimated_vs_measured_2',
    title: 'Measured vs. Estimated Production [kWh] (line graphs)',
    plot: (data, stacked) => {
      if (stacked) {
        return [
          Plot.barY(data, {
            x: 'year',
            y: 'measured_production',
            fill: 'year',
            fx: 'month',
            channels: {
              measured_production: 'measured_production',
              estimated_production: 'estimated_production',
            },
            tip: {
              format: {
                x: true,
                fx: true,
                measured_production: (d) => `${formatNumber(d)} kWh`,
                estimated_production: (d) => `${formatNumber(d)} kWh`,
              },
            },
          }),
          Plot.barY(data, {
            x: 'year',
            y: 'estimated_production',
            stroke: 'black',
            fx: 'month',
          }),
        ]
      }
      return [
        Plot.ruleY([0]),
        Plot.line(data, {
          x: 'date',
          y: 'measured_production',
          stroke: 'black',
          curve: 'step-after',
          channels: {
            measured_production: 'measured_production',
            estimated_production: 'estimated_production',
          },
          tip: {
            format: {
              x: true,
              measured_production: (d) => `${formatNumber(d)} kWh`,
              estimated_production: (d) => `${formatNumber(d)} kWh`,
            },
          },
        }),
        Plot.line(data, {
          x: 'date',
          y: 'estimated_production',
          stroke: 'blue',
          curve: 'step-after',
        }),
      ]
    },
  },
  {
    name: 'estimated_measured_difference',
    title: 'Difference between Estimated and Measured Production [kWh]',
    plot: (data, stacked) => {
      if (stacked) {
        return [
          Plot.barY(data, {
            x: 'year',
            y: 'diff_production',
            fill: 'year',
            fx: 'month',
            tip: {
              format: {
                x: true,
                fx: true,
                y: (d) => `${formatNumber(d)} kWh`,
              },
            },
          }),
        ]
      }
      return [
        Plot.line(data, {
          x: 'date',
          y: 'diff_production',
          curve: 'step-after',
          tip: {
            format: {
              x: true,
              y: (d) => `${formatNumber(d)} kWh`,
            },
          },
        }),
      ]
    },
  },
  {
    name: 'estimated_measured_ratio',
    title: 'Ratio between Estimated and Measured Production [%]',
    plot: (data, stacked) => {
      if (stacked) {
        return [
          Plot.barY(data, {
            x: 'year',
            y: 'ratio_production',
            fill: 'year',
            fx: 'month',
            tip: {
              format: {
                x: true,
                fx: true,
                y: (d) => `${formatNumber(d)}%`,
              },
            },
          }),
        ]
      }
      return [
        Plot.line(data, {
          x: 'date',
          y: 'ratio_production',
          curve: 'step-after',
          tip: {
            format: {
              x: true,
              y: (d) => `${formatNumber(d)}%`,
            },
          },
        }),
      ]
    },
  },
]

export function getAnalysisType(name: string) {
  return analysisTypes.find((item) => item.name == name)
}

function calcMetrics(datapoint: PvProductionMonthlyStat) {
  if (datapoint.year && datapoint.month && datapoint.energy) {
    const estimated =
      datapoint.energy.estimated_production === undefined
        ? null
        : datapoint.energy.estimated_production
    const measured =
      datapoint.energy.measured_production === undefined
        ? null
        : datapoint.energy.measured_production
    return [
      {
        date: new Date(datapoint.year, datapoint.month - 1, 1),
        year: datapoint.year.toString(),
        month: datapoint.month,
        estimated_production: estimated,
        measured_production: measured,
        diff_production: estimated != null && measured != null ? estimated - measured : null,
        ratio_production: estimated && measured != null ? (measured / estimated) * 100.0 : null,
      },
    ]
  }
  return []
}

async function getData(installationId: number): Promise<PlotData[]> {
  const result = await ky
    .get('/api/pv_production_monthly_stats', {
      searchParams: {
        'where[or][0][and][0][installation][equals]': installationId,
        sort: '-year,-month',
        depth: 0,
        limit: 120,
      },
    })
    .json<MonthlyStatsResult>()
  return result.docs.reverse().flatMap(calcMetrics)
}

export function LineChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<PlotData[]>()
  const [view, setView] = useState<PlotView>({
    installationId: null,
    analysisType: analysisTypes[0],
    stackYears: false,
  })

  function updateView(updatedValue: Partial<PlotView>) {
    setView((view) => ({
      ...view,
      ...updatedValue,
    }))
  }

  useEffect(() => {
    if (view?.installationId) {
      getData(view.installationId).then((d) => setData(d))
    }
  }, [view.installationId])

  useEffect(() => {
    if (data === undefined) return
    const plot = Plot.plot({
      title: view.analysisType.title,
      width: 800,
      color: { scheme: 'spectral', legend: true, type: 'ordinal' },
      y: { grid: true, tickFormat: 's' },
      x: view.stackYears ? { axis: null } : {},
      marks: view.analysisType.plot(data, view.stackYears),
    })
    if (containerRef.current) {
      containerRef.current.append(plot)
    }
    return () => plot.remove()
  }, [data, view])

  return (
    <div className="plotcontainer">
      <div className="plot" ref={containerRef} />
      <ChartSettings view={view} updateView={updateView} />
    </div>
  )
}
