export class PoolId {
  public static contract = (address: string): AbstractPoolId => ({
    contract: address,
  })

  public static id = (id: number): AbstractPoolId => ({
    id,
  })

  public static separateAddresses = (swap: string, liquidity: string): AbstractPoolId => ({
    separate_addresses: {
      swap,
      liquidity,
    },
  })
}
