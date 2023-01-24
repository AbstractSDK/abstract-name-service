import { Exchange } from './exchange'
import wretch from 'wretch'
import { match, P } from 'ts-pattern'
import { AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { Network } from '../networks/network'
import { NotFoundError } from '../registry/IRegistry'

const WYND_DEX = 'Wynd'

const WYND_POOL_TYPE: PoolType = 'ConstantProduct'

interface WyndOptions {
  poolListUrl: string
  assetListUrl: string
}

export class Wynd extends Exchange {
  private options: WyndOptions
  private poolListCache: WyndPoolList | undefined

  async fetchPoolList(): Promise<WyndPoolList> {
    if (this.poolListCache) {
      return this.poolListCache
    }

    const poolList: WyndPoolList = await wretch(this.options.poolListUrl).get().json()
    this.poolListCache = poolList
    return poolList
  }

  constructor(options: WyndOptions) {
    super(WYND_DEX)
    this.options = options
  }

  async registerAssets(network: Network) {
    const poolList = await this.fetchPoolList()
    console.log(`Found ${Object.keys(poolList).length} pools on Wynd`)

    for (const wyndTokenInfos of Object.values(poolList)) {
      for (const info of wyndTokenInfos) {
        try {
          match(info)
            .with({ token: P.select() }, (token) => {
              const name = network.assetRegistry.getByDenom(token)
              if (!name) {
                throw new NotFoundError(`Asset ${token} not found in registry`)
              }
              network.registerLocalAsset(name, AssetInfo.cw20(token))
            })
            .with({ native: P.select() }, (native) => {
              network.registerNativeAsset({ denom: native })
            })
            .exhaustive()
        } catch (e) {
          if (e instanceof NotFoundError) {
            console.warn(`Skipping asset ${info} because of missing asset: ${e}`)
            return
          }
          throw e
        }
      }
    }
  }

  async registerPools(network: Network) {
    const poolList = await this.fetchPoolList()

    for (const [address, assetInfos] of Object.entries(poolList)) {
      let assetNames
      try {
        assetNames = this.findAssetNames(network, assetInfos)
      } catch (e) {
        if (e instanceof NotFoundError) {
          console.warn(`Skipping pool ${address} because of missing asset: ${e}`)
          continue
        }
        throw e
      }

      network.poolRegistry.register(
        new AnsPoolEntry(PoolId.contract(address), this.buildPoolMetadata(assetNames))
      )
    }
  }

  private tokenAddressFromPoolInfo(info: WyndAssetInfo): string {
    return match(info)
      .with({ token: P.select() }, (token) => token)
      .with({ native: P.select() }, (native) => native)
      .exhaustive()
  }

  private findAssetNames(network: Network, infos: WyndAssetInfo[]): string[] {
    return infos.map((info) => {
      const address = this.tokenAddressFromPoolInfo(info)
      const name = network.assetRegistry.getByDenom(address)
      if (!name) {
        throw new NotFoundError(`Asset ${address} not found in registry`)
      }
      return name
    })
  }

  private buildPoolMetadata(assetNames: string[]): AbstractPoolMetadata {
    return {
      dex: this.name.toLowerCase(),
      pool_type: WYND_POOL_TYPE,
      assets: assetNames,
    }
  }
}

interface Cw20WyndAssetInfo {
  token: string
  amount: string
}

interface NativeWyndAssetInfo {
  native: string
  amount: string
}

type WyndAssetInfo = Cw20WyndAssetInfo | NativeWyndAssetInfo

type WyndPoolList = Record<string, WyndAssetInfo[]>
