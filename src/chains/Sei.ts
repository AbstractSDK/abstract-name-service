import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Pacific1 } from '../networks/pacific1'
import { Atlantic2 } from '../networks/atlantic2'

// Assets found from https://github.com/PulsarDefi/IBC-Token-Data-Cosmos/blob/be2be11b0f8ed55ed1f55bb9255e25f53b145ef1/native_token_data.json#L3912C1-L3912C1
const mainnet = new Pacific1(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'eth-wormhole>usdt',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/HktfLoADCk9mnjv7XJiN4YXK9ayE6xinLzt8wzcsR2rY',
        },
      ],
      [
        'eth-wormhole>usdc',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/Hq4tuDzhRBnxw3tFA5n6M52NVMVcC19XggbyDiJKCD6H',
        },
      ],
      [
        'bsc-wormhole>usdt',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/871jbn9unTavWsAe83f2Ma9GJWSv6BKsyWYLiQ6z3Pva',
        },
      ],
      [
        'bsc-wormhole>usdc',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/3Ri4N719RQfQaudHiB9CMCYACtK3aieoz1q1Ph24VdAb',
        },
      ],
      [
        'bsc-wormhole>weth',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/9tTHn18vLnfyBvrQaia6N15zwrfRCAebZDshoPZ39ahN',
        },
      ],
      [
        'arb-wormhole>weth',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/9hJDBDaxqQQhF5HhaPUykeLncBa38XQ5uoNxN3tPQu5r',
        },
      ],
      [
        'op-wormhole>usdc',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/3VKKYtbQ9iq8f9CaZfgR6Cr3TUj6ypXPAn6kco6wjcAu',
        },
      ],
      [
        'arb-wormhole>usdc',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/7edDfnf4mku8So3t4Do215GNHwASEwCWrdhM5GqD51xZ',
        },
      ],
      [
        'matic-wormhole>usdc',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/DUVFMY2neJdL8aE4d3stcpttDDm5aoyfGyVvm29iA9Yp',
        },
      ],
      [
        'sol-wormhole>usdc',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/9fELvUhFo6yWL34ZaLgPbCPzdk9MD1tAzMycgH45qShH',
        },
      ],
      [
        'eth-wormhole>weth',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/4tLQqCLaoKKfNFuPjA9o39YbKUwhR1F8N29Tz3hEbfP2',
        },
      ],
      [
        'eth-wormhole>wbtc',
        {
          native:
            'factory/sei189adguawugk3e55zn63z8r9ll29xrjwca636ra7v7gxuzn98sxyqwzt47l/7omXa4gryZ5NiBmLep7JsTtTtANCVKXwT9vbN91aS1br',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)
const testnet = new Atlantic2(new AssetRegistry(), new ContractRegistry(), new PoolRegistry())

export class Sei extends Chain {
  constructor() {
    super('sei', [mainnet])
  }
}
