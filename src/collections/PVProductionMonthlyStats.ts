import { and, eq, gte, lte, sql } from '@payloadcms/db-sqlite/drizzle'
import type { CollectionConfig, PayloadRequest } from 'payload'
import { isOwner } from '@/access/whereOwnerOrAdmin'

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
  access: {
    read: isOwner,
    create: isOwner,
    update: isOwner,
    delete: isOwner,
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
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      index: true,
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

  const result = await req.payload.db.drizzle.transaction(async (tx) => {
    // Drop existing values
    // for simplicity drop all months in the year touched by the range. Could be improved lated
    console.log('Delete statistics for installation', installationId)
    const deleteResult = await tx
      .delete(pv_production_monthly)
      .where(
        and(
          eq(pv_production_monthly.installation, installationId),
          gte(pv_production_monthly.year, from.getFullYear()),
          lte(pv_production_monthly.year, to.getFullYear()),
        ),
      )
      .execute()
    console.log('Deleted ' + deleteResult.rowsAffected + ' rows')

    // Recalculate all values within those years
    console.log('Recalculate statistics for installation', installationId)
    // Those queries are SQLite specific. Whenever the db adapter gets replaces, those queries need to be adjusted
    const groupSelect = tx.$with('stats').as(
      tx
        .select({
          installation: sql`${installationId}`.as('installation'),
          year: sql`strftime('%Y', ${pv_production_history.from})`.as('year'),
          month: sql`strftime('%m', ${pv_production_history.from})`.as('month'),
          energy_measured_production:
            sql`SUM(${pv_production_history.energy_measured_production})`.as(
              'energy_measured_production',
            ),
          energy_estimated_production:
            sql`SUM(${pv_production_history.energy_estimated_production})`.as(
              'energy_estimated_production',
            ),
        })
        .from(pv_production_history)
        .where(
          and(
            eq(pv_production_history.installation, installationId),
            gte(sql`strftime('%Y', ${pv_production_history.from})`, from.getFullYear().toString()),
            lte(sql`strftime('%Y', ${pv_production_history.to})`, to.getFullYear().toString()),
          ),
        )
        .groupBy((r) => [r.installation, r.year, r.month]),
    )
    const selectQuery = tx
      .with(groupSelect)
      .select({
        id: sql`NULL`.as('id'),
        installation: groupSelect.installation,
        year: groupSelect.year,
        month: groupSelect.month,
        energy_measured_production: groupSelect.energy_measured_production,
        energy_estimated_production: groupSelect.energy_estimated_production,
        updatedAt: sql`datetime('now')`.as('updatedAt'),
        createdAt: sql`datetime('now')`.as('createdAt'),
      })
      .from(groupSelect)

    const insertQuery = tx.insert(pv_production_monthly).select(selectQuery)

    const result = await insertQuery.execute()
    console.log('Inserted ' + result.rowsAffected + ' rows')
    return result
  })

  return Response.json({ status: 'Ok', stats_calculated: result.rowsAffected })
}
