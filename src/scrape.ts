/**
 * The following lines intialize dotenv,
 * so that env vars from the .env file are present in process.env
 */
// import { loadExchanges } from './loaders/exchange.loader'
import { readFile, writeFile } from 'fs'
// import the json from networks.json
import { array, command, multioption, oneOf, run } from 'cmd-ts'
import { Chain, ChainExporter, Juno } from './chains'
import { Terra2 } from './chains/Terra2'
import { match } from 'ts-pattern'
import { Osmosis } from './chains/Osmosis'
import { install as sourceMapSupportInstall } from 'source-map-support'

sourceMapSupportInstall()

const CHAIN_OPTIONS = ['terra', 'osmosis', 'juno'] as const
type ChainOption = typeof CHAIN_OPTIONS[number]

const main = command({
  name: 'ans-scraper',
  args: {
    chainNames: multioption({
      // stupid that it doesn't accept readonly array -_-
      type: array(oneOf(CHAIN_OPTIONS.map((c) => c.toString()))),
      description: '',
      short: '-c',
      long: 'chains',
    }),
  },
  handler: async ({ chainNames }) => {
    if (chainNames.length === 0) {
      console.log('No chains specified, exiting...')
      return
    }

    const chains: Chain[] = chainNames.map((chain) =>
      match(chain as ChainOption)
        .with('terra', () => new Terra2())
        .with('juno', () => new Juno())
        .with('osmosis', () => new Osmosis())
        .exhaustive()
    )

    const exporter = new ChainExporter(chains)
    await exporter.registerAll()

    const assets = await exporter.exportAssets()
    const pools = await exporter.exportPools()
    const contracts = await exporter.exportContracts()

    console.log(`Assets: ${JSON.stringify(assets)}`)
    console.log(`Contracts: ${JSON.stringify(contracts)}`)
    console.log(`Pools: ${JSON.stringify(pools)}`)

    writeChainDataMapToFile(assets, outFile('assets'))
    writeChainDataMapToFile(pools, outFile('pools'))
    writeChainDataMapToFile(contracts, outFile('contracts'))
  },
})

run(main, process.argv.slice(2))

const outFile = (fileName: string) => `./out/${fileName}.json`

// TODO: read existing and add, don't overwrite
function writeChainDataMapToFile<V>(newMap: Map<ChainName, Map<string, V[]>>, fileName: string) {
  const { signal } = new AbortController()

  readFile(fileName, (err, data) => {
    if (err) {
      console.error(err)
      return
    }

    const existingData: Record<string, Record<string, V[]>> = JSON.parse(data.toString())
    for (const [chainName, chainData] of newMap) {
      if (!existingData[chainName]) {
        existingData[chainName] = {}
      }

      for (const [networkId, networkEntries] of chainData) {
        existingData[chainName][networkId] = networkEntries
      }
    }

    const merged = new Map(Object.entries(existingData))

    writeFile(fileName, stringifyMap(merged), { signal }, (err) => {
      if (err) {
        console.error(err)
        return
      }
    })
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
