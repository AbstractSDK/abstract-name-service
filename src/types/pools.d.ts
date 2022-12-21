type AbstractPoolId =
  | {
      contract: string
    }
  | {
      id: number
    }

type PoolType = 'Stable' | 'Weighted' | 'LiquidityBootstrap' | 'ConstantProduct'

type AbstractPoolMetadata = {
  dex: string
  pool_type: PoolType
  assets: string[]
}
