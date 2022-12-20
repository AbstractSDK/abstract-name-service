/**
 * The following lines intialize dotenv,
 * so that env vars from the .env file are present in process.env
 */
// import { loadExchanges } from './loaders/exchange.loader'
import { writeFile } from 'fs'
// import the json from networks.json
import { Juno } from './chains/Juno'
import { Chains } from './chains/chains'

type ChainName = string
type NetworkId = string

async function main() {
  const juno = new Juno()

  const chains = new Chains([juno])

  const assets = await chains.exportAssets()

  writeMapToFile(assets, outFile('assets2'))


}

main()

const outFile = (fileName: string) => `./out/${fileName}.json`

function writeMapToFile<K, V>(map: Map<K, V>, fileName: string) {
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
