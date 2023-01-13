/**
 * The following lines intialize dotenv,
 * so that env vars from the .env file are present in process.env
 */
// import { loadExchanges } from './loaders/exchange.loader'
import { readFile, writeFile } from 'fs'
// import the json from networks.json
import { array, command, multioption, oneOf, run } from 'cmd-ts'
import { Chain, ChainExporter, Juno } from './chains'
import { Terra } from './chains/Terra'
import { match } from 'ts-pattern'
import { Osmosis } from './chains/Osmosis'

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
        .with('terra', () => new Terra())
        .with('juno', () => new Juno())
        .with('osmosis', () => new Osmosis())
        .exhaustive()
    )

    const exporter = new ChainExporter(chains)

    const assets = await exporter.exportAssets()
    writeMapToFile(assets, outFile('assets'))

    const contracts = await exporter.exportContracts()
    writeMapToFile(contracts, outFile('contracts'))

    const pools = await exporter.exportPools()
    writeMapToFile(pools, outFile('pools'))
  },
})

run(main, process.argv.slice(2))

const outFile = (fileName: string) => `./out/${fileName}.json`

// TODO: read existing and add, don't overwrite
function writeMapToFile<K, V>(newMap: Map<K, V>, fileName: string) {
  const { signal } = new AbortController()

  readFile(fileName, (err, data) => {
    if (err) {
      console.error(err)
      return
    }

    const existingData = JSON.parse(data.toString())
    const existingMap = new Map(Object.entries(existingData))
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const merged = new Map([...newMap, ...existingMap])

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
