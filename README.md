Small console toolset for getting information about Substrate nodes.\
Right now, implemented in Typescript. In future, it is going to be ported to Rust with subxt.

# Installation

Add yarn binaries folder into yout PATH:
```
echo "export PATH=$(yarn global bin):$PATH'" >> ~/.bashrc
source ~/.bashrc
```

Link binaries into yarn folder:
```
cd typescript
yarn install
yarn run tsc
chmod +x dist/info.js dist/events.js dist/blocks.js dist/contracts.js
yarn link
./bind.sh
```

# Tools

All binaries accept `--url` option for selecting node.\
E.g. `rpc-info --url $(cat kusama.url)` will grab metadata from Kusama network.\
By default, `ws://127.0.0.1:9944` is used.

**`rpc-info`: metadata and couple of other bits**


**`rpc-events`: log of emitted events**\
Any argument is treated as module name to filter events with.


**`rpc-balances`: subscribe to balances changes**\
Provide a list of accounts to monitor, URIs like `//Alice` are also supported.
* `--evm` for monitoring EVM balances


**`rpc-blocks`: log of produced blocks**
* `--new` for subscribing to fresh blocks
* `--old` for dumping historical blocks
* `--all` for both historical blocks and new ones
* `--header` for displaying headers instead of hashes
* `--full` for displaying full content of blocks
* `--pretty` for pretty-printing jsons\
*[TODO]*: option for listing only finalized/non-finalized blocks


**`rpc-transfer`: transfer funds between accounts**\
Example: `rpc-transfer //Alice 1DEV //Bob`


**`rpc-contracts`: uploading, instantiating and calling smart contracts**\
*[WORK IN PROGRESS]*


**`rpc-evm`: creating/calling contracts and depositing/withdrawing EVM accounts**\
*[WORK IN PROGRESS]* 

# Uninstallation

To remove binaries from PATH:
```
yarn unlink
```
