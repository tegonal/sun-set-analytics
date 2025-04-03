'use client'

import {useEffect, useState} from 'react'
import {PlotView} from './lineChart'
import { Select, Heading, Label } from 'theme-ui'
import ky from 'ky'

interface InstallationOptions {
    key: number
    label: string
}

export function ChartSettings({ config, updateConfig }: {config: PlotView, updateConfig: void}) {
  
  const [options, setOptions] = useState<InstallationOptions[]>([{key: 1, label: "One"}, {key: 2, label: "Two"}])

  useEffect(() => {
    async function fetchData() {
        const opt: InstallationOptions[] = []
        const results = await ky.get('/api/installations/',{
        searchParams: {
          //'where[or][0][and][0][installation][equals]': installation_id,
           depth:0,
           limit: 100}
        }).json()
        console.log(results)
        results.docs.forEach((i) => {
                     console.log(i)
                     opt.push({key: i.id, label: i.name})
                }
            )
        setOptions(opt)
    }   
    fetchData()
  }, [])

  return(<div>
  <Heading as='h4'>Settings</Heading>
  <Label>Installation:</Label>
  <Select defaultValue="" onChange={(e) => updateConfig({installation_id: e.target.value})}>
    { options.map((o) => (
        <option key={o.key} value={o.key}>{o.label}</option>
    ))}
  </Select> {config.installation_id}</div>)
}