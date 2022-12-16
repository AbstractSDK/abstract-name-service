type AbstractPoolId =
  | {
      contract: string
    }
  | {
      id: number
    }

type PoolType = 'stable' | 'weighted' | 'liquidity_bootstrap' | 'constant_product'

type AbstractPoolMetadata = {
  dex: string
  poolType: PoolType
  assets: string[]
}
