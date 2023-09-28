type AbstractPoolId =
  | {
      contract: string
    }
  | {
      id: number
    }
  | {
      separate_addresses: {
        swap: string
        liquidity: string
      }
    }

type PoolType = 'Stable' | 'Weighted' | 'LiquidityBootstrap' | 'ConstantProduct'

type AbstractPoolMetadata = {
  dex: string
  pool_type: PoolType
  assets: string[]
}
