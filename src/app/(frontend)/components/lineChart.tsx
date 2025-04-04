'use client'

import { PvProductionMonthlyStat } from '@/payload-types'
import * as Plot from '@observablehq/plot'
import ky from 'ky'
import { useEffect, useRef, useState } from 'react'
import { ChartSettings } from './chartSettings'

interface PlotData {
  date: Date
  estimated_production: number | null
  measured_production: number | null
  diff_production: number | null
  ratio_production: number | null
}

interface AnalysisType {
  name: string
  title: string
  plot: (data: PlotData[]) => Plot.Markish[]
}

export interface PlotView {
  installationId: number
  analysisType: AnalysisType
  stackYears: boolean
}

interface MonthlyStatsResult {
  docs: PvProductionMonthlyStat[]
}

export const analysisTypes: AnalysisType[] = [
  { name: "estimated_vs_measured_1",
    title: "Estimated vs. Measured Production [kWh]",
    plot: (data) => { return [
      Plot.differenceY(data, {
        x: 'date',
        y1: 'estimated_production',
        y2: 'measured_production',
        curve: 'step-after',
        tip: true})
      ]}
  },
  { name: "estimated_vs_measured_2",
    title: "Estimated vs. Measured Production [kWh] (lines)",
    plot: (data) => { return [
      Plot.line(data, {
        x: 'date',
        y: 'measured_production',
        stroke: 1,
        curve: 'step-after',
        tip: true}),
      Plot.line(data, {
        x: 'date',
        y: 'estimated_production',
        stroke: 2,
        curve: 'step-after',
        tip: true}),
      ]}
  },
  { name: "estimated_measured_difference",
    title: "Difference between Estimated and Measured Production [kWh]",
    plot: (data) => { return [
      Plot.line(data, {
        x: 'date',
        y: 'diff_production',
        curve: 'step-after',
        tip: true}),
      ]}
  },
  { name: "estimated_measured_ratio",
    title: "Ratio between Estimated and Measured Production [%]",
    plot: (data) => { return [
      Plot.line(data, {
        x: 'date',
        y: 'ratio_production',
        curve: 'step-after',
        tip: true}),
      ]}
  },
]

export function getAnalysisType(name: string) {
  return analysisTypes.find(item => item.name == name)
}

function calcMetrics(datapoint: PvProductionMonthlyStat) {
  if (datapoint.year && datapoint.month && datapoint.energy) {
    const estimated = datapoint.energy.estimated_production === undefined ? null : datapoint.energy.estimated_production
    const measured = datapoint.energy.measured_production === undefined ? null : datapoint.energy.measured_production
    return [{
      date: new Date(datapoint.year, datapoint.month-1, 1),
      estimated_production: estimated,
      measured_production: measured,
      diff_production: estimated != null && measured != null ? estimated-measured : null,
      ratio_production: estimated && measured != null ? measured/estimated*100.0 : null,
    }]
  }
  return []
}

async function getData(installationId: number): Promise<PlotData[]> {
  const result = await ky.get('/api/pv_production_monthly_stats',{
    searchParams: {
      'where[or][0][and][0][installation][equals]': installationId,
       depth:0,
       limit: 100}
    }).json<MonthlyStatsResult>()
  return result.docs.flatMap(calcMetrics)
}

export function LineChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<PlotData[]>()
  const [view, setView] = useState<PlotView>(
    {installationId: 3,
     analysisType: analysisTypes[0],
     stackYears: false,
    }
  )

  function updateView(updatedValue: Partial<PlotView>) {
    console.log("update config:")
    console.log(updatedValue)
    setView(view => ({
      ...view,
      ...updatedValue
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
      y: { grid: true },
      marks: view.analysisType.plot(data).concat([Plot.frame()])
    })
    if (containerRef.current) {
      containerRef.current.append(plot)
    }
    return () => plot.remove()
  }, [data, view])

  return (
    <div className="plotcontainer">
      <div className="plot" ref={containerRef} />
      <ChartSettings view={view} updateView={updateView}/>
    </div>
  )
}
