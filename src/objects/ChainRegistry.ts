import { chains } from 'chain-registry'
export class ChainRegistry {
  static chainIdToName(chainId: string): string {
    const chainName = chains.find((c) => c.chain_id === chainId)?.chain_name
    if (!chainName) {
      throw new Error(`chain not found for chain id ${chainId}`)
    }
    return chainName
  }
}
