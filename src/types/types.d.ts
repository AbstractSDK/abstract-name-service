// type Chain = string
type ChainName = 'juno' | 'archway' | 'osmosis' | 'terra2'

type Addr = string

type CwAssetInfo =
  | {
      native: string
    }
  | {
      cw20: Addr
    }
  | {
      cw1155: [Addr, string]
    }

type AbstractContractEntry = {
  contract: string
  protocol: string
}


type ChainName = string
type NetworkId = string
