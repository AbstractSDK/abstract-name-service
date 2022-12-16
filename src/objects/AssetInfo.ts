export class AssetInfo {
  public static cw20 = (address: string): AbstractAssetInfo => ({
    cw20: address,
  })

  public static cw1155 = (address: string, tokenId: string): AbstractAssetInfo => ({
    cw1155: [address, tokenId],
  })

  public static native = (denom: string): AbstractAssetInfo => ({
    native: denom,
  })

  public static from(address: string): AbstractAssetInfo {
    if (address.startsWith('ibc/')) {
      return AssetInfo.native(address)
    } else if (address.length === 44) {
      return AssetInfo.cw20(address)
    }
    // non contracts are native
    return AssetInfo.native(address)
  }
}
