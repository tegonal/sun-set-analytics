'use client'

import { useEffect, useState } from 'react'
import ky from 'ky'

import { Installation } from '@/payload-types'
import { PlotView, analysisTypes, getAnalysisType } from './lineChart'

import { Select, Label, Switch } from 'theme-ui'
import { isNumber } from 'payload/shared'

interface SelectOptions {
  key: number | string
  label: string
}

interface InstallationsResult {
  docs: Installation[]
}

export function ChartSettings({
  view,
  updateView,
}: {
  view: PlotView
  updateView: (x: Partial<PlotView>) => void
}) {
  const [installationOptions, setInstallationOptions] = useState<SelectOptions[]>([])

  useEffect(() => {
    async function fetchData() {
      const results: InstallationsResult = await ky
        .get('/api/installations/', {
          searchParams: {
            depth: 0,
            limit: 100,
          },
        })
        .json()
      setInstallationOptions(
        results.docs.flatMap((inst) => (inst.name ? [{ key: inst.id, label: inst.name }] : [])),
      )
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (
      view.installationId === null &&
      installationOptions.length &&
      isNumber(installationOptions[0].key)
    ) {
      updateView({ installationId: installationOptions[0].key })
    }
  }, [view.installationId, installationOptions, updateView])

  return (
    <div>
      <Label htmlFor="installation">Installation</Label>
      <Select
        name="installation"
        mb={3}
        defaultValue=""
        onChange={(e) => updateView({ installationId: parseInt(e.target.value) })}
      >
        {installationOptions.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </Select>
      <Label>Analysis Type</Label>
      <Select
        name="type"
        mb={3}
        defaultValue=""
        onChange={(e) => updateView({ analysisType: getAnalysisType(e.target.value) })}
      >
        {analysisTypes.map((o) => (
          <option key={o.name} value={o.name}>
            {o.title}
          </option>
        ))}
      </Select>
      <Switch
        label="Compare years"
        mb={3}
        sx={{
          'input:checked ~ &': {
            backgroundColor: '#4269d0',
          },
        }}
        onChange={(e) => updateView({ stackYears: e.target.checked })}
      />
    </div>
  )
}
