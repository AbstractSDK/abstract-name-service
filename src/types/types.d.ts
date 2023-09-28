// type Chain = string
type ChainName =
  | 'juno'
  | 'archway'
  | 'osmosis'
  | 'terra2'
  | 'neutron'
  | 'kujira'
  | 'sei'
  | 'injective'

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

type NetworkId = string
