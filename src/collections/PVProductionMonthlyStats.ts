import { and, eq, gte, lte, sql } from '@payloadcms/db-sqlite/drizzle'
import type { CollectionConfig, PayloadRequest } from 'payload'

export const PVProductionMonthlyStats: CollectionConfig = {
  slug: 'pv_production_monthly_stats',
  labels: {
    singular: 'PV production monthly statistic',
    plural: 'PV production monthly stats',
  },
  admin: {
    group: 'Statistics',
    // mark as hidden after testing or in production mode
    hidden: false,
  },
  fields: [
    {
      type: 'relationship',
      name: 'installation',
      hasMany: false,
      relationTo: 'installations',
    },
    {
      type: 'row',
      fields: [
        {
          type: 'number',
          min: 2000,
          max: 2025,
          index: true,
          name: 'year',
        },
        {
          type: 'number',
          name: 'month',
          min: 1,
          max: 12,
          index: true,
        },
      ],
    },
    {
      type: 'group',
      name: 'energy',
      fields: [
        {
          type: 'number',
          name: 'measured_production',
          admin: {
            description: 'measured production data kWh',
          },
        },
        {
          type: 'number',
          name: 'estimated_production',
          required: false,
          admin: {
            description: 'normalized estimated production data kWh',
          },
        },
      ],
    },
  ],
}

export async function recalculateStatisticsForTimeWindow(
  req: PayloadRequest,
  installationId: number,
  from: Date,
  to: Date,
): Promise<Response> {
  const pv_production_history = req.payload.db.tables['pv_production']
  const pv_production_monthly = req.payload.db.tables['pv_production_monthly_stats']

  // Drop existing values
  // for simplicity drop all months in the year touched by the range. Could be improved lated
  console.log('Delete statistics for installation', installationId)
  await req.payload.db.drizzle
    .delete(pv_production_monthly)
    .where(
      and(
        eq(pv_production_monthly.installation, installationId),
        gte(pv_production_monthly.year, from.getFullYear()),
        lte(pv_production_monthly.year, to.getFullYear()),
      ),
    )
    .execute()

  // Recalculate all values within those years
  console.log('Recalculate statistics for installation', installationId)
  const stats = req.payload.db.drizzle.$with('stats').as(
    req.payload.db.drizzle
      .select({
        installation: sql`inline(${installationId}`.as('installation'),
        year: sql`YEAR(${pv_production_history.from})`.as('year'),
        month: sql`MONTH(${pv_production_history.from})`.as('month'),
        measured_production: sql`SUM(${pv_production_history.energy_measured_production})`.as(
          'measured_production',
        ),
        estimated_production: sql`SUM(${pv_production_history.energy_estimated_production})`.as(
          'estimated_production',
        ),
      })
      .from(pv_production_history)
      .where(eq(pv_production_history.installationId, installationId)),
  )
  const insertQuery = req.payload.db.drizzle
    .with(stats)
    .insert(pv_production_monthly)
    /*.select(
      req.payload.db.drizzle
        .select({
          installation: sql`inline(${installationId}`.as('installation'),
          year: sql`YEAR(${pv_production_history.from})`.as('year'),
          month: sql`MONTH(${pv_production_history.from})`.as('month'),
          measured_production: sql`SUM(${pv_production_history.measured_production})`.as(
            'measured_production',
          ),
          estimated_production: sql`SUM(${pv_production_history.estimated_production})`.as(
            'estimated_production',
          ),
        })
        .from(pv_production_history)
        .where(eq(pv_production_history.installationId, installationId)),
    )*/
    .values(
      req.payload.db.drizzle
        .select({
          installation: sql`inline(${installationId}`.as('installation'),
          year: sql`YEAR(${pv_production_history.from})`.as('year'),
          month: sql`MONTH(${pv_production_history.from})`.as('month'),
          measured_production: sql`SUM(${pv_production_history.measured_production})`.as(
            'measured_production',
          ),
          estimated_production: sql`SUM(${pv_production_history.estimated_production})`.as(
            'estimated_production',
          ),
        })
        .from(pv_production_history)
        .where(eq(pv_production_history.installationId, installationId)),
    )
  //.values(sql`select * from stats`)
  console.log('query', insertQuery.toSQL())
  await insertQuery.execute()

  return Response.json({ status: 'Ok' })
}
