import { Exchange } from './exchange'

class Terraswap extends Exchange {
  constructor() {
    super('Terraswap', 'terra')
  }
}

const test = {
  query:
    '\n  query Query($limit: Int, $sortField: PoolSortFields) {\n    pools(limit: $limit, sortField: $sortField) {\n      lp_address\n      pool_address\n      token_symbol\n      trading_fee\n      pool_liquidity\n      _24hr_volume\n      trading_fees {\n        apy\n        apr\n        day\n      }\n      astro_rewards {\n        apy\n        apr\n        day\n      }\n      protocol_rewards {\n        apy\n        apr\n        day\n      }\n      total_rewards {\n        apy\n        apr\n        day\n      }\n      prices {\n        token1_address\n        token1_price_usd\n        token2_address\n        token2_price_usd\n      }\n      stakeable\n      pool_type\n      reward_proxy_address\n    }\n  }\n',
  variables: {
    limit: 500,
    sortField: 'TVL',
  },
  operationName: 'Query',
}
