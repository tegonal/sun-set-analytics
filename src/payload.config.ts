// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { openapi, swaggerUI } from 'payload-oapi'

import { Users } from './collections/Users'
import { Installations } from './collections/Installations'
import { PVProductionHistory } from './collections/PVProductionHistory'
import { PVProductionMonthlyStats } from './collections/PVProductionMonthlyStats'

import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  telemetry: false,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Installations, PVProductionHistory, PVProductionMonthlyStats],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Sunset analytics API', version: '0.0.1' },
      enabled: true,
    }),
    swaggerUI({
      enabled: true,
    }),
    // storage-adapter-placeholder
  ],
})
