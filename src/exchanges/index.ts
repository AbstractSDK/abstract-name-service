import { Junoswap } from './junoswap'
import { Osmosis } from './osmosis'
import { Exchange } from './exchange'

const exchanges: Exchange[] = [new Junoswap(), new Osmosis()]
export default exchanges
