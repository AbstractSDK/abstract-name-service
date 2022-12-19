/**
 * The following lines intialize dotenv,
 * so that env vars from the .env file are present in process.env
 */
// import { loadExchanges } from './loaders/exchange.loader'
import exchanges from './exchanges'
import { writeFile } from 'fs'
// import the json from networks.json
import chainToNetworks from './config/networks.json'
import { AnsAssetEntry, AnsContractEntry, AnsPoolEntry } from './objects'
import { Exchange } from './exchanges/exchange'

type ChainName = string
type NetworkId = string

async function main() {
  // const uni5: Network = new Network()
  // const junoswap = new Junoswap()
  await writeAssetsToFile()
  await writePoolsToFile()
  // await writeContractsToFile()
}

main()

const outDir = (fileName: string) => `./out/${fileName}.json`

async function writeAssetsToFile() {
  const chainAssets = new Map<ChainName, Map<NetworkId, AnsAssetEntry[]>>()
  await writeChainDataToFile(chainAssets, 'assets', (exchange, network) =>
    exchange.registerAssets(network)
  )
}

async function writePoolsToFile() {
  const chainPools = new Map<ChainName, Map<NetworkId, AnsPoolEntry[]>>()
  await writeChainDataToFile(chainPools, 'pools', (exchange, network) =>
    exchange.registerPools(network)
  )
}

async function writeContractsToFile() {
  const chainContracts = new Map<ChainName, Map<NetworkId, AnsContractEntry[]>>()
  await writeChainDataToFile(chainContracts, 'contracts', (exchange, network) =>
    exchange.registerContracts(network)
  )
}

async function writeChainDataToFile<T>(
  chainData: Map<ChainName, Map<NetworkId, T[]>>,
  fileName: string,
  retrieveEntries: (exchange: Exchange, network: NetworkId) => Promise<T[]>
) {
  for (const [chain, chainNetworks] of Object.entries(chainToNetworks)) {
    chainData.set(chain, new Map())

    const supportedExchanges = exchanges.filter((exchange) => exchange.chain === chain)
    console.log(`Found ${supportedExchanges.length} exchanges for chain ${chain}`)

    for (const network of chainNetworks) {
      const existingData = chainData.get(chain)?.get(network) ?? []

      for (const exchange of supportedExchanges) {
        const exchangeData = await retrieveEntries(exchange, network)
        console.log(
          `Found ${exchangeData.length} ${fileName} for ${network} on ${exchange.dexName}`
        )

        exchangeData.forEach((item) => {
          const dupe = existingData.find(
            (existingItem) => JSON.stringify(existingItem) === JSON.stringify(item)
          )
          if (dupe) {
            console.warn(
              `Duplicate ${fileName} found for ${network} on ${exchange.dexName} ${JSON.stringify(
                dupe
              )}`
            )
          }
          existingData.push(item)
        })
      }

      chainData.get(chain)?.set(network, existingData)
    }
  }

  writeMapToFile(chainData, outDir(fileName))
}

const writeMapToFile = <K, V>(map: Map<K, V>, fileName: string) => {
  const { signal } = new AbortController()

  writeFile(fileName, stringifyMap(map), { signal }, (err) => {
    // When a request is aborted - the callback is called with an AbortError
    console.error(err)
  })
}

function stringifyMap<K, V>(myMap: Map<K, V>) {
  function selfIterator(map: Map<K, V>) {
    return Array.from(map).reduce((acc, [key, value]) => {
      if (value instanceof Map) {
        // @ts-ignore
        acc[key] = selfIterator(value)
      } else {
        // @ts-ignore
        acc[key] = value
      }

      return acc
    }, {})
  }

  const res = selfIterator(myMap)
  return JSON.stringify(res, null, 2)
}

export = main
