# Abstract Name Service Scraper
## Commands
- `pnpm install` - Install dependencies
- `pnpm run dev` - Run development server to listen for changes
- `pnpm run build` - Build the project
- `pnpm run start` - Run the built project (will run [app.ts](./src/scrape.ts))
- `pnpm run lint` - Run linter
- `pnpm run format` - Run formatter
- `pnpm run test` - Run tests (lol)
- `pnpm test:watch` to run tests in watch (loop) mode
- `pnpm test:coverage` to see the tests coverage report.


## Run with Docker

1. Build:

    ```
    docker build -t ans-asset-scraper .
    ```

    Replacing `ans-asset-scraper` with the image name.

2. Run
    ```
    docker run -d -p 3000:3000 ans-asset-scraper
    ```
    Replacing `ans-asset-scraper` with the image name, and `3000:3000` with the `host:container` ports to publish.

# Naming Convention Reference

## Contracts
Staking contracts are stored in the CONTRACTS data structure in ANS. 
Key:
```
{
  protocol: 'junoswap',
  contract: 'staking:juno,osmo',
}
```
Value:
```
junoxxxx
```
## Assets
### Cw20 / Native / Cw1155
Assets are stored in the ASSETS data structure in ANS.
Key:
```
dao
```
Value:
```
{
 "cw20": "juno1lqhg97uxqlm7qhl4dylm2ynzf6z8r3px9epc23epkcu3703tal7qwj6vun"
}
```
### IBC
IBC Tokens are stored with the key `ORIGIN_CHAIN>ASSET_NAME`, for example:
Key:
```
terra>ustc
```
Value:
```
{
 "native": "ibc/2DA4136457810BCB9DAAB620CA67BC342B17C3C70151CA70490A170DF7C9CB27"
}
```

This can be chained to express multi-hopped assets `ORIGIN_CHAIN>INTERMEDIATE_CHAIN>ASSET_NAME`.

### LP Tokens
Key:
```
"junoswap/crab,junox"
```
Value: 
```
{
 "cw20": "juno1lgsnuhss0s9swc3ykeh32r8z60gses0dhawzl2wtdeatncrqm3jq8vfpn2"
}
```
