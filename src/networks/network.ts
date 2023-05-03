import { chains } from 'chain-registry'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry, AssetInfo } from '../objects'
import { IbcExtension, QueryClient, setupIbcExtension } from '@cosmjs/stargate'
import { Exchange } from '../exchanges'
import { ContractRegistry } from '../registry/contractRegistry'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Tendermint34Client } from '@cosmjs/tendermint-rpc'
import { ChainRegistry } from '../objects/ChainRegistry'
import { NotFoundError } from '../registry/IRegistry'
import { AnsName } from '../objects/AnsName'
import { Cw20QueryClient } from '@abstract-os/abstract.js'
import LocalCache from '../helpers/LocalCache'

interface INetwork {
  networkId: string
  assetRegistry: AssetRegistry
  contractRegistry: ContractRegistry
  poolRegistry: PoolRegistry
  exchanges: Exchange[]
}

const testEndpoint = async (url: string) =>
  await fetch(url)
    .then((res) => res.status === 200)
    .catch(() => false)

interface IbcAssetInfo {
  baseDenom: string
  path: string
}

export abstract class Network {
  networkId: string
  assetRegistry: AssetRegistry
  contractRegistry: ContractRegistry
  poolRegistry: PoolRegistry
  globalCache: LocalCache
  private exchanges: Exchange[]

  protected constructor({
    networkId,
    assetRegistry,
    contractRegistry,
    poolRegistry,
    exchanges,
  }: INetwork) {
    this.networkId = networkId
    this.assetRegistry = assetRegistry
    this.contractRegistry = contractRegistry
    this.poolRegistry = poolRegistry
    this.exchanges = exchanges
    this.globalCache = new LocalCache(networkId)
  }

  public async registerNativeAssetInfo(info: Extract<CwAssetInfo, { native: unknown }>) {
    return await this.registerNativeAsset({ denom: info.native, symbol: undefined })
  }

  /**
   * if it's a native asset, we check if its registered already. If not registered, it is not a preknown asset, so we generate a new entry
   */
  public async registerNativeAsset({ denom, symbol }: { denom: string; symbol?: string }) {
    const assetInfo = AssetInfo.native(denom)

    if (this.assetRegistry.hasDenom(denom)) {
      return
    }

    if (AssetInfo.isIbcDenom(denom)) {
      // deal with IBC assets
      try {
        return await this.registerIbcAsset(denom)
      } catch (e) {
        console.error(`Failed to register IBC asset ${denom}: ${e}`)
        // TODO: check IBC registration
        // TODO: use implementation in OsmosisDex

        // We don't know any ibc denoms by default
        return this.assetRegistry.unknownAsset(denom, denom)
      }
    }

    if (!symbol) {
      try {
        symbol = this.findNativeAssetSymbol(denom)
      } catch (e) {
        if (e instanceof NotFoundError) {
          console.error(`Failed to find symbol for ${denom}: ${e}`)
          return this.assetRegistry.unknownAsset(denom, denom)
        } else {
          throw e
        }
      }
    }

    // If it's not IBC, register it!
    return this.registerLocalAsset(symbol, assetInfo)
  }

  /**
   * Take an IBC asset denom, attempt to find its details, then register it
   * @param denom
   */
  public async registerIbcAsset(denom: string) {
    let resolvedBaseDenom: string
    // Check if we already know the base denom
    if (await this.globalCache.hasValue('ibcBaseDenoms', denom)) {
      resolvedBaseDenom = (
        await this.globalCache.getValueUnchecked<IbcAssetInfo>('ibcBaseDenoms', denom)
      ).baseDenom
    } else {
      const ibcQueryClient = await this.ibcQueryClient()

      let denomTrace
      try {
        denomTrace = await ibcQueryClient.ibc.transfer.denomTrace(denom).then(({ denomTrace }) => {
          if (!denomTrace) {
            throw new Error(`No denom trace for ${denom}`)
          }
          return denomTrace
        })
      } catch (e) {
        console.error(`Failed to get denom trace for ${denom}: ${e}`)
        throw e
      }

      // { path: 'transfer/channel-4', baseDenom: 'uxprt' }
      const { path, baseDenom } = denomTrace

      // [ 'transfer', 'channel-4' ]
      const splitPath = path.split('/')

      if (splitPath.length !== 2) {
        console.log(`Skipping ${denom} because path is not 2 in length: ${path}`)
        return this.assetRegistry.unknownAsset(baseDenom, denom)
      }

      // ['transfer', 'channel-4']
      const [portId, channelId] = splitPath

      // const channelInfo = await ibcQueryClient.ibc.channel.channel(portId, channelId);

      if (portId !== 'transfer') {
        console.warn(`Denom trace path for ${denom} is not transfer, but ${portId}`)
        return this.assetRegistry.unknownAsset(baseDenom, denom)
      }
      resolvedBaseDenom = baseDenom
      await this.globalCache.setValue<IbcAssetInfo>('ibcBaseDenoms', denom, { baseDenom, path })
    }

    // persistence>xprt
    const ansName = ChainRegistry.externalChainDenomToAnsName(resolvedBaseDenom)

    // Pause before executing a new query
    await new Promise((resolve) => setTimeout(resolve, 200))
    return this.assetRegistry.register(new AnsAssetEntry(ansName, AssetInfo.native(denom)))
  }

  /**
   * Build a network-specific ans asset entry (juno>junox => ujunox)
   */
  public localAssetEntry(symbol: string, info: CwAssetInfo): AnsAssetEntry {
    return new AnsAssetEntry(AnsName.chainIdIbcAsset(this.networkId, symbol), info)
  }

  /**
   * Register an asset to the asset registry of this network.
   * @param symbol lowercased symbol of the asset. Will be prefixed with this chain's name.
   * @param info
   */
  public registerLocalAsset(symbol: string, info: CwAssetInfo) {
    return this.assetRegistry.register(this.localAssetEntry(symbol, info))
  }

  public async registerCw20Info(info: Extract<CwAssetInfo, { cw20: unknown }>) {
    return this.registerCw20Asset(info.cw20)
  }

  public async registerCw20Asset(cw20Address: string) {
    if (this.assetRegistry.hasDenom(cw20Address)) {
      return
    }
    const symbol = await this.queryCw20Symbol(cw20Address)

    return this.registerLocalAsset(symbol, AssetInfo.cw20(cw20Address))
  }

  public async queryCw20Symbol(cw20Address: string): Promise<string> {
    // check if we already know the symbol
    if (await this.globalCache.hasValue('cw20Symbols', cw20Address)) {
      return await this.globalCache.getValueUnchecked('cw20Symbols', cw20Address)
    }

    const client = new Cw20QueryClient(await this.queryClient(), cw20Address)
    try {
      const info = await client.tokenInfo()
      const symbol = info.symbol.toLowerCase()
      await this.globalCache.setValue('cw20Symbols', cw20Address, symbol)
      return symbol
    } catch (e) {
      throw new Error(`Failed to query cw20 symbol for ${cw20Address}: ${e}`)
    }
  }

  public async queryClient(): Promise<CosmWasmClient> {
    return CosmWasmClient.connect(await this.rpcUrl())
  }

  public async ibcQueryClient(): Promise<QueryClient & IbcExtension> {
    const tendermintClient = await Tendermint34Client.connect(await this.rpcUrl())
    return QueryClient.withExtensions(tendermintClient, setupIbcExtension)
  }

  private async rpcUrl(): Promise<string> {
    const chain = chains.find(({ chain_id }) => chain_id === this.networkId)
    if (!chain) throw new NotFoundError(`Chain ${this.networkId} not found in chain-registry`)

    if (this.networkId === 'phoenix-1') {
      return 'https://terra-rpc.polkachu.com/'
    }

    const rpc = `https://rpc.cosmos.directory/${chain}`
    const chainRegistryRpcs = chain.apis?.rpc?.map(({ address }) => address) || []

    const rpcs = [rpc, ...chainRegistryRpcs]

    for (const rpc of rpcs) {
      if (await testEndpoint(rpc)) return rpc
    }
    throw new Error(`No RPC found for ${this.networkId}`)
  }

  protected findNativeAssetSymbol(denom: string): string {
    return ChainRegistry.findSymbol(this.networkId, denom)
  }

  /**
   * Register everything that is known about this network.
   */
  async registerAll() {
    await Promise.all(this.exchanges.map((exchange) => exchange.registerAssets(this)))
    await Promise.all(this.exchanges.map((exchange) => exchange.registerContracts(this)))
    await Promise.all(this.exchanges.map((exchange) => exchange.registerPools(this)))
  }

  async exportAssets(): Promise<AnsAssetEntry[]> {
    return this.assetRegistry.export()
  }

  async exportContracts(): Promise<AnsContractEntry[]> {
    return this.contractRegistry.export()
  }

  async exportPools(): Promise<AnsPoolEntry[]> {
    return this.poolRegistry.export()
  }
}
