type Chain = string
// type Chain = 'juno' | 'archway' | 'osmosis' | 'terra';

type AssetEntry = string
type Addr = string

type AbstractAssetInfo =
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
type AnsAssetEntry = [AssetEntry, AbstractAssetInfo]
