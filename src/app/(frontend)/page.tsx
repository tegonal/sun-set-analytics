import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.css'

import { LineChart } from './components/lineChart'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="home">
      <div className="content">
        {!user && <h3>Welcome to Sunset Analytics.</h3>}
        {user && <h3>Welcome back, {user.email}</h3>}
        <LineChart />
      </div>
      <div className="footer">
        <a href="https://github.com/tegonal/sun-set-analytics">GitHub</a>
      </div>
    </div>
  )
}
