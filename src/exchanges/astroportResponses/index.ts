import neutron1 from './neutron-1'
import phoenix1 from './phoenix-1'

export const ASTROPORT_POOLS = {
  ['neutron-1']: neutron1.result.data.json,
  ['phoenix-1']: phoenix1.result.data.json,
}
