'use client'

import { PvProductionMonthlyStat } from '@/payload-types'
import * as Plot from '@observablehq/plot'
//import * as d3 from 'd3'
import ky from 'ky'
import { useEffect, useRef, useState } from 'react'

interface PlotData {
  date: Date
  estimated_production: number | null
  measured_production: number | null
}

interface PlotView {
  installation_id: number
}

interface MonthlyStatsResult {
  docs: PvProductionMonthlyStat[]
}

async function getData(installation_id: number): Promise<PlotData[]> {
  const d: PlotData[] = []
  const result = await ky.get('http://localhost:3000/api/pv_production_monthly_stats',{searchParams: {'where[or][0][and][0][installation][equals]': installation_id}}).json<MonthlyStatsResult>()
  result.docs.forEach((dp) => {
    if (dp.year && dp.month && dp.energy) {
      const estimated = dp.energy.estimated_production === undefined ? null : dp.energy.estimated_production
      const measured = dp.energy.measured_production === undefined ? null : dp.energy.measured_production
      d.push({ date: new Date(dp.year, dp.month-1, 1), estimated_production: estimated, measured_production: measured})
    }
  })
  /*const d: PlotData[] = [
    { date: new Date(2022, 1 - 1, 15), value: 1 },
    { date: new Date(2022, 2 - 1, 15), value: 2 },
    { date: new Date(2022, 3 - 1, 15), value: 3 },
    { date: new Date(2022, 4 - 1, 15), value: 2 },
    { date: new Date(2022, 5 - 1, 15), value: 5 },
    { date: new Date(2022, 6 - 1, 15), value: 6 },
    { date: new Date(2022, 7 - 1, 15), value: 7 },
  ]
  console.log(d)*/
  return d
}

export function LineChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<PlotData[]>()
  const [config, setConfig] = useState<PlotView>({installation_id: 1})

  useEffect(() => {
    if (config) {
      getData(config.installation_id).then((d) => setData(d))
    }
  }, [config])

  useEffect(() => {
    if (data === undefined) return
    const plot = Plot.plot({
      title: 'Test',
      width: 800,
      y: { grid: true },
      color: { scheme: 'burd' },

      marks: [
        Plot.ruleY([0]),
        /*Plot.line(data, { x: 'date', y: 'measured_production', tip: true }),
        Plot.line(data, { x: 'date', y: 'estimated_production', tip: true }),*/
        Plot.differenceY(data, {x: 'date', y1: 'estimated_production', y2: 'measured_production', tip: true}),
        //Plot.crosshairX(data, { x: 'date', y: 'value' }),
        Plot.frame(),
      ],
    })
    if (containerRef.current) {
      containerRef.current.append(plot)
    }
    return () => plot.remove()
  }, [data])
  return <div className="plot" ref={containerRef} />
}
