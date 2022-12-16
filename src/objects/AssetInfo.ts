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
}
