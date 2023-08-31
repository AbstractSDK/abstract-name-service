import { Exchange } from './exchange'
import { Network } from '../networks/network'
import LocalCache from '../helpers/LocalCache'
import wretch from 'wretch'
import { AnsAssetEntry, AnsPoolEntry, AssetInfo, PoolId } from '../objects'
import { NotFoundError } from '../registry/IRegistry'

const KUJIRA_DEX_NAME = 'kujira'

interface FinOptions {
  contractsUrl: string
  cacheSuffix: string
}

/*
https://github.com/Team-Kujira/kujira.js/blob/55c87de91e14415931a55e2f5ef4c1307be32845/src/fin/pairs.ts#L26C1-L31C3
 */
const STAKING_CONTRACTS = {
  ['harpoon-4']: 'kujira1e7hxytqdg6v05f8ev3wrfcm5ecu3qyhl7y4ga73z76yuufnlk2rqd4uwf4',
  ['MAINNET_PLACEHOLDER']: 'kujira1p2j2cq4g3jjrz53ceku725t4uectn89hw35sehf8fpq9qfzvufeqymyem8',
}

export class Fin extends Exchange {
  private options: FinOptions
  private localCache: LocalCache

  constructor(options: FinOptions) {
    super(KUJIRA_DEX_NAME)
    this.options = options
    this.localCache = new LocalCache(`${KUJIRA_DEX_NAME}-${options.cacheSuffix}`)
  }

  async fetchContracts(network: Network): Promise<RootName> {
    return await wretch(this.options.contractsUrl).get().json()
  }

  async fetchPools(network: Network): Promise<FinItem[]> {
    const contracts = await this.fetchContracts(network)
    return contracts[network.networkId].bow
  }

  async registerAssets(network: Network) {
    const pools = await this.fetchPools(network)

    for (const { config } of pools) {
      for (const denom of config.denoms || []) {
        if (typeof denom === 'string') {
          await network.registerNativeAsset({ denom })
        } else {
          await network.registerNativeAssetInfo(denom)
        }
      }
    }
  }

  async registerPools(network: Network) {
    const pools = await this.fetchPools(network)

    for (const { config, address: liquidityAddress } of pools) {
      const denoms = config.denoms || []
      if (!denoms.length) {
        console.error(`Pool with address ${liquidityAddress} has no denoms`)
        continue
      }
      let assetNames

      try {
        // Use the already-registered asset names
        assetNames = network.assetRegistry.getNamesByInfos(
          denoms.map((d) => (typeof d === 'string' ? AssetInfo.native(d) : d))
        )
      } catch (e) {
        if (e instanceof NotFoundError) {
          // TODO
          // if (network.assetRegistry.hasSkipped(token1_address)) {
          //
          // }
        }
        console.error(`Could not resolve assets for pool with addr ${liquidityAddress}`)
        return
      }

      const poolMetadata = this.poolMetadata(assetNames)

      const swapAddress = config.fin_contract
      if (!swapAddress) {
        console.error(`Pool with address ${liquidityAddress} has no swap address`)
        continue
      }

      network.poolRegistry.register(
        new AnsPoolEntry(PoolId.separateAddresses(swapAddress, liquidityAddress), poolMetadata)
      )

      // TODO: this is in the wrong place lol
      const lpTokenName = this.lpTokenName(assetNames)

      const lpTokenAddress = this.kujiraLpTokenAddress(liquidityAddress)

      // Sanity check that the LP token exists
      await network.factoryQueryClient().then((fc) => fc.bank.denomMetadata(lpTokenAddress))

      network.assetRegistry.register(new AnsAssetEntry(lpTokenName, AssetInfo.from(lpTokenAddress)))

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (!STAKING_CONTRACTS[network.networkId]) {
        throw new Error(`No staking contract for network ${network.networkId}`)
      }
      const stakingContract = this.stakingContractEntry(
        assetNames,
        STAKING_CONTRACTS[network.networkId as keyof typeof STAKING_CONTRACTS]
      )

      network.contractRegistry.register(stakingContract)
    }
  }

  /**
   * LP Token is the pool address, with the prefix `factory/` and suffix `/ulp`
   */
  private kujiraLpTokenAddress(poolAddress: string): string {
    return `factory/${poolAddress}/ulp`
  }

  private poolMetadata(assets: string[]): AbstractPoolMetadata {
    return {
      dex: this.name.toLowerCase(),
      pool_type: 'ConstantProduct',
      assets,
    }
  }
}

type RootName = Record<
  string,
  {
    fin: FinItem[]
    bow: BowItem[]
    bowStaking: BowStakingItem[]
    orca: OrcaItem[]
    uskMarket: UskMarketItem[]
    uskMarginSwap: UskMarginSwapItem[]
    uskMarginLimit: any[]
    calc: CalcItem[]
    ghostVault: GhostVaultItem[]
    ghostMarket: GhostMarketItem[]
    ghostMargin: any[]
    pilot: PilotItem[]
  }
>
interface FinItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
interface Config {
  owner?: string
  denoms?: DenomsItem[] | string[]
  price_precision?: Price_precision
  is_bootstrapping?: boolean
  decimal_delta?: number
  fee_taker?: string
  fee_maker?: string
  fin_contract?: string
  intervals?: string[]
  fee?: string
  amp?: string
  incentive_fee?: Incentive_fee
  incentive_min?: string
  markets?: string[]
  bid_denom?: string
  collateral_denom?: string
  bid_threshold?: string
  max_slot?: number
  premium_rate_per_slot?: string
  closed_slots?: any[]
  waiting_period?: number
  liquidation_fee?: string
  withdrawal_fee?: string
  fee_address?: string
  stable_denom?: string
  stable_denom_admin?: string
  oracle_denom?: string
  max_ratio?: string
  mint_fee?: string
  interest_rate?: string
  orca_address?: string
  max_debt?: string
  liquidation_threshold?: string
  liquidation_ratio?: string
  market?: Market
  fin_address?: string
  denom?: string
  oracle?: Oracle
  decimals?: number
  receipt_denom?: string
  debt_token_denom?: string
  interest?: Interest
  vault_addr?: string
  orca_addr?: string
  collateral_oracle_denom?: string
  collateral_decimals?: number
  max_ltv?: string
  full_liquidation_threshold?: string
  partial_liquidation_target?: string
  borrow_fee?: string
  deposit?: Deposit
  orca_code_id?: number
  sale_fee?: string
  fin_addr?: string
  ask_denom?: string
}
interface DenomsItem {
  native: string
}
interface Price_precision {
  decimal_places: number
}
interface BowItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
interface BowStakingItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
interface Incentive_fee {
  denom: string
  amount: string
}
interface OrcaItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
interface UskMarketItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
interface UskMarginSwapItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
interface Market {
  owner: string
  stable_denom?: string
  stable_denom_admin?: string
  collateral_denom: string
  oracle_denom?: string
  max_ratio?: string
  mint_fee?: string
  interest_rate?: string
  orca_address?: string
  max_debt?: string
  liquidation_threshold?: string
  liquidation_ratio?: string
  vault_addr?: string
  orca_addr?: string
  collateral_oracle_denom?: string
  collateral_decimals?: number
  max_ltv?: string
  full_liquidation_threshold?: string
  partial_liquidation_target?: string
  borrow_fee?: string
}
interface CalcItem {
  id: number
  address: string
  config: Config
  pairs: PairsItem[]
  markets: boolean
}
interface PairsItem {
  denoms: string[]
}
interface GhostVaultItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: MarketsItem[]
}
interface Oracle {
  static?: string
  live?: string
}
interface Interest {
  utilization_to_rate?: any[]
  utilization_to_curve?: any[]
}
interface MarketsItem {
  addr: string
  borrow_limit: null | string
  current_borrows: string
}
interface UtilizationToCurveItemItem {
  linear: Linear
}
interface Linear {
  start: string[]
  end: string[]
}
interface GhostMarketItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
interface PilotItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
interface Deposit {
  denom: string
  amount: string
}
interface UskMarginLimitItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
interface GhostMarginItem {
  id: number
  address: string
  config: Config
  pairs: boolean
  markets: boolean
}
