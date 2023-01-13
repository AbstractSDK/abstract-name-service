/**
 * The following lines intialize dotenv,
 * so that env vars from the .env file are present in process.env
 */
// import { loadExchanges } from './loaders/exchange.loader'
import { readFile, writeFile } from 'fs'
// import the json from networks.json
import { Chains } from './chains'
import { Terra } from './chains/Terra'

// TODO: cli arguments
async function main() {
  // const juno = new Juno()

  // const osmosis = new Osmosis()
  // const chains = new Chains([juno, osmosis])

  const chains = new Chains([new Terra()])

  const assets = await chains.exportAssets()
  writeMapToFile(assets, outFile('assets'))

  const contracts = await chains.exportContracts()
  writeMapToFile(contracts, outFile('contracts'))

  const pools = await chains.exportPools()
  writeMapToFile(pools, outFile('pools'))
}

main()

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
