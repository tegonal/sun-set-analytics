import React from 'react'

import './styles.css'

import { LineChart } from './components/lineChart'

export default async function HomePage() {
  return (
    <div className="home">
      <div className="content">
        <LineChart />
      </div>
      <div className="footer">
        <a href="https://github.com/tegonal/sun-set-analytics">GitHub</a>
      </div>
    </div>
  )
}
