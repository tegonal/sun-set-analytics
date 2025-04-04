'use client'

import {useEffect, useState} from 'react'
import ky from 'ky'

import { Installation } from '@/payload-types'
import {PlotView, analysisTypes, getAnalysisType} from './lineChart'

import { Select, Label, Switch } from 'theme-ui'

interface SelectOptions {
    key: number | string
    label: string
}

interface InstallationsResult {
    docs: Installation[]
}

export function ChartSettings({ view, updateView }: {view: PlotView, updateView: (x: Partial<PlotView>) => void}) {
  
  const [installationOptions, setInstallationOptions] = useState<SelectOptions[]>([])

  useEffect(() => {
    async function fetchData() {
        const results: InstallationsResult = await ky.get('/api/installations/',{
        searchParams: {
          // TODO: filter by user 'where[or][0][and][0][installation][equals]': installation_id,
           depth:0,
           limit: 100}
        }).json()
        setInstallationOptions(
          results.docs.flatMap((inst) => inst.name ? [{key: inst.id, label: inst.name}] : [])
        )
    }   
    fetchData()
  }, [])

  return(<div>
    <Label htmlFor="installation">Installation</Label>
    <Select name="installation" mb={3} defaultValue="" onChange={(e) => updateView({installationId: parseInt(e.target.value)})}>
      { installationOptions.map((o) => (
        <option key={o.key} value={o.key}>{o.label}</option>
      ))}
    </Select>
    <Label>Analysis Type</Label>
    <Select name="type" mb={3} defaultValue="" onChange={(e) => updateView({analysisType: getAnalysisType(e.target.value)})} >
      { analysisTypes.map((o) => (
        <option key={o.name} value={o.name}>{o.title}</option>
      ))}
    </Select>
    <Switch label="Stack years (TODO)" mb={3} sx={{
      'input:checked ~ &': {
        backgroundColor: '#4269d0',
      },
      }}
      onChange={(e) => updateView({stackYears: e.target.checked})}
    />
    {view.installationId} | {view.analysisType.name} | {view.stackYears ? "y" : "n"}
    </div>
  )
}