import { fromBech32 } from 'cosmwasm'

export class AssetInfo {
  public static cw20 = (address: string): CwAssetInfo => ({
    cw20: address,
  })

  public static cw1155 = (address: string, tokenId: string): CwAssetInfo => ({
    cw1155: [address, tokenId],
  })

  public static native = (denom: string): CwAssetInfo => ({
    native: denom,
  })

  public static from(address: string): CwAssetInfo {
    try {
      fromBech32(address)
      return AssetInfo.cw20(address)
    } catch (e) {}

    if (this.isIbcDenom(address)) {
      return AssetInfo.native(address)
    }
    // non contracts are native
    return AssetInfo.native(address)
  }

  public static isIbcDenom(denom: string): boolean {
    return denom.startsWith('ibc/')
  }
}
