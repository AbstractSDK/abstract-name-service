import { chains } from 'chain-registry'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry, AssetInfo } from '../objects'
import {
  BankExtension,
  IbcExtension,
  QueryClient,
  setupBankExtension,
  setupIbcExtension,
} from '@cosmjs/stargate'
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
import { bech32 } from 'bech32'
import { Cw20Helper } from '../helpers/Cw20Helper'
import { Chain } from '@chain-registry/types'

type TokenMetadata = UnwrapPromise<ReturnType<BankExtension['bank']['denomMetadata']>>

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

export const RPC_OVERRIDES = {
  'phoenix-1': 'https://terra-rpc.polkachu.com/',
  'neutron-1': 'https://neutron-rpc.polkachu.com/',
  'atlantic-2': 'https://sei-testnet-rpc.polkachu.com/',
}

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
  chain: Chain
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
    this.chain = ChainRegistry.findChainBy({ chain_id: networkId })
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
    } else if (AssetInfo.isFactoryDenom(denom)) {
      try {
        return await this.registerFactoryAsset(denom)
      } catch (e) {
        console.error(`Failed to register factory asset ${denom}: ${e}`)

        // We don't know any factory denoms by default
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
   * Register a token factory asset.
   * @param denom
   */
  public async registerFactoryAsset(denom: string) {
    let metadata: TokenMetadata
    // Check if we already know the base denom
    if (await this.globalCache.hasValue('denomMetadata', denom)) {
      metadata = await this.globalCache.getValueUnchecked<TokenMetadata>('denomMetadata', denom)
    } else {
      const factoryClient = await this.factoryQueryClient()

      try {
        metadata = await factoryClient.bank.denomMetadata(denom)
        await this.globalCache.setValue<TokenMetadata>('denomMetadata', denom, metadata)
      } catch (e) {
        console.error(`Failed to get metadata for ${denom}: ${e}`)
        throw e
      }
    }

    // TODO: this will retrieve "uhans" for example
    const symbol = metadata.symbol ? metadata.symbol : denom.split('/')[2]

    // Pause before executing a new query
    await new Promise((resolve) => setTimeout(resolve, 500))
    this.registerLocalAsset(symbol, { native: denom })
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
        denomTrace = await ibcQueryClient.ibc.transfer
          .denomTrace(denom.split('/')[1])
          .then(({ denomTrace }) => {
            if (!denomTrace) {
              throw new Error(`No denom trace for ${denom}`)
            }
            return denomTrace
          })
          .catch((e) => {
            console.error(`Failed to get denom trace for ${denom.split('/')[1]}: ${e}`)
            throw e
          })
      }

      // { path: 'transfer/channel-4', baseDenom: 'uxprt' }
      const { path, baseDenom } = denomTrace

      // [ 'transfer', 'channel-4' ]
      const splitPath = path.split('/')

      if (splitPath.length !== 2) {
        console.log(
          `Skipping ${denom} with base denom ${baseDenom} because path is not 2 in length: ${path}`
        )
        return this.assetRegistry.unknownAsset(baseDenom, denom)
      }

      // ['transfer', 'channel-4']
      const [portId, channelId] = splitPath

      // const channelInfo = await ibcQueryClient.ibc.channel.channel(portId, channelId);

      if (portId !== 'transfer') {
        console.warn(`Denom trace path for ${denom} is not transfer, but ${portId}`)
        return this.assetRegistry.unknownAsset(baseDenom, denom)
      }

      // console.log(`Has portId: ${portId} and channelId: ${channelId}`)
      resolvedBaseDenom = baseDenom
      await this.globalCache.setValue<IbcAssetInfo>('ibcBaseDenoms', denom, { baseDenom, path })
    }

    let ansName
    // resolvedBaseDenom may be a cw20... so if it starts with cw20 then
    if (resolvedBaseDenom.startsWith('cw20:')) {
      const cw20Address = resolvedBaseDenom.replace('cw20:', '')
      const { prefix } = bech32.decode(cw20Address)
      const chain = ChainRegistry.findChainBy({
        bech32_prefix: prefix,
        network_type: this.chain.network_type,
      })

      const symbol = await Cw20Helper.init(chain, cw20Address).then((helper) => helper.getSymbol())

      ansName = AnsName.chainNameIbcAsset(chain.chain_name, symbol)
    } else {
      // persistence>xprt
      ansName = ChainRegistry.externalChainDenomToAnsName(resolvedBaseDenom)
    }

    // Pause before executing a new query
    await new Promise((resolve) => setTimeout(resolve, 500))
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

    const client = new Cw20Helper(new Cw20QueryClient(await this.queryClient(), cw20Address))
    const symbol = await client.getSymbol()
    await this.globalCache.setValue('cw20Symbols', cw20Address, symbol)
    return symbol
  }

  public async queryClient(): Promise<CosmWasmClient> {
    return CosmWasmClient.connect(await this.rpcUrl())
  }

  public async ibcQueryClient(): Promise<QueryClient & IbcExtension> {
    const tendermintClient = await Tendermint34Client.connect(await this.rpcUrl())
    return QueryClient.withExtensions(tendermintClient, setupIbcExtension)
  }

  public async factoryQueryClient(): Promise<QueryClient & BankExtension> {
    const tendermintClient = await Tendermint34Client.connect(await this.rpcUrl())
    return QueryClient.withExtensions(tendermintClient, setupBankExtension)
  }

  private async rpcUrl(): Promise<string> {
    const chain = chains.find(({ chain_id }) => chain_id === this.networkId)
    if (!chain) throw new NotFoundError(`Chain ${this.networkId} not found in chain-registry`)

    if (Object.keys(RPC_OVERRIDES).includes(this.networkId)) {
      return RPC_OVERRIDES[this.networkId as keyof typeof RPC_OVERRIDES]
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
