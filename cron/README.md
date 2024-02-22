# ANS Updater

The Abstract Name Service Updater (ANSU) is a tool that allows us to keep the on-chain ANS state up-to-date with this repo. To do this we use a combination of github actions, crates.io data and custom deployment data to determine which ANS contracts and records need to be updated.

## How it works

The script can be triggered by two different events:

1. An update is made to the state of the ANS repo, in particular the data contained in the `out` directory. If any of this data changes, a github action will run the script and the script will diff the repo's state with the state of all the tracked versions it has.
2. A new deployment of the ANS contracts is made. In this case the address of the deployed contract is provided to the script and all the relevant data to that deployment is uploaded to the relevant ANS contract.

In both cases a deployment `state.json` is used as the reference for finding the ANS addresses of a deployment.

## Running Manually

```bash
cargo run --bin update_ans
```
