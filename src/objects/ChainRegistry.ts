import { assets, chains } from 'chain-registry'
import { AnsName } from './AnsName'
import { NotFoundError } from '../registry/IRegistry'
import { Chain } from '@chain-registry/types'
import _ from 'lodash'

const BLOCKLISTED_CHAIN_NAMES = ['terra', 'terratestnet']

const allChains = chains.filter(({ chain_name }) => !BLOCKLISTED_CHAIN_NAMES.includes(chain_name))

export class ChainRegistry {
  static findChainBy<K extends keyof Chain>(filters: { [P in K]?: Chain[P] }): Chain {
    let filteredChains = allChains

    // Apply each filter
    for (const key in filters) {
      const value = filters[key as K]
      filteredChains = filteredChains.filter((chain) => _.isEqual(chain[key as K], value))
    }

    if (!filteredChains.length) {
      throw new Error(`Chain not found by filters: ${JSON.stringify(filters)}`)
    } else if (filteredChains.length > 1) {
      // console.log(filteredChains)
      throw new Error(
        `${filteredChains.length} chains found by filters: ${JSON.stringify(filters)}`
      )
    }

    return filteredChains[0]
  }

  static chainIdToName(chainId: string): string {
    const chainName = allChains.find((c) => c.chain_id === chainId)?.chain_name
    if (!chainName) {
      if (chainId === 'pisco-1') return 'terra2testnet'
      throw new NotFoundError(`chain not found for chain id ${chainId}`)
    }
    return chainName
  }

  static externalChainDenomToAnsName(searchDenom: string): string {
    let found: { chain: string; symbol: string } | undefined
    for (const list of assets.filter(
      ({ chain_name }) => !BLOCKLISTED_CHAIN_NAMES.includes(chain_name)
    )) {
      const { chain_name, assets } = list
      const foundAsset = assets.find((unit) =>
        unit.denom_units.some((unit) => unit.denom === searchDenom)
      )
      if (foundAsset) {
        found = { chain: chain_name, symbol: foundAsset.symbol.toLowerCase() }
        break
      }
    }
    if (!found) {
      throw new NotFoundError(`asset not found for address ${searchDenom}`)
    }
    return AnsName.chainNameIbcAsset(found.chain, found.symbol)
  }

  static findSymbol(chainId: string, denom: string): string {
    const chainName = this.chainIdToName(chainId)
    const asset = assets
      .filter(({ chain_name }) => !BLOCKLISTED_CHAIN_NAMES.includes(chain_name))
      .find((a) => a.chain_name === chainName)
      ?.assets.find((a) => a.denom_units.some((u) => u.denom === denom))
    if (!asset) {
      throw new NotFoundError(`asset not found for chain ${chainName} and denom ${denom}`)
    }
    return asset.symbol.toLowerCase()
  }
}
