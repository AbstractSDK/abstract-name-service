# Abstract Name Service Scraper
## Commands
- `pnpm install` - Install dependencies
- `pnpm run dev` - Run development server to listen for changes
- `pnpm run build` - Build the project
- `pnpm run start` - Run the built project (will run [app.ts](./src/app.ts))
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

# Abstract Reference
## Pools
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

