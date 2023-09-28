import { ContractRegistry } from '../registry/contractRegistry'
import { Chain } from './chain'
import { PoolRegistry } from '../registry/poolRegistry'
import { AssetRegistry } from '../registry/assetRegistry'
import { Harpoon4 } from '../networks/harpoon4'

const harpoon_4 = new Harpoon4(
  new AssetRegistry({
    assetRegistry: new Map([
      [
        'kujira>kuji',
        {
          native: 'ukuji',
        },
      ],
      [
        'kujira>usk',
        {
          native: 'factory/kujira1r85reqy6h0lu02vyz0hnzhv5whsns55gdt4w0d7ft87utzk7u0wqr4ssll/uusk',
        },
      ],
      [
        'kujira>hans',
        {
          native: 'factory/kujira1mc8r0mcrye0tcwldn82fyyaa4zv6vve9j2me6h/uhans',
        },
      ],
    ]),
  }),
  new ContractRegistry(),
  new PoolRegistry()
)

export class Kujira extends Chain {
  constructor() {
    super('kujira', [harpoon_4])
  }
}
