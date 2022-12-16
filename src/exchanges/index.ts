import { Junoswap } from './junoswap'
import { Osmosis } from './osmosis'
import { Exchange } from './exchange'
import { Astroport } from './astroport'

const exchanges: Exchange[] = [new Junoswap(), new Osmosis(), new Astroport()]
export default exchanges
