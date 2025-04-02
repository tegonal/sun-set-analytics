import { Installation } from '@/payload-types'

export interface EstimatedProductionProviderService {
  fetchEstimatedProductionData(
    installation: Installation,
    from: Date,
    to: Date,
  ): Promise<ProductionData | undefined>
}

export interface ProductionData {
  calculateForDateRange(from: Date, to: Date): Promise<number | undefined>
}
