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
tsc
chmod +x dist/info.js dist/events.js dist/blocks.js dist/contracts.js
yarn link
./bind.sh
```

# Tools

All binaries accept `--url` option for selecting node.\
E.g. `rpc-info --url $(cat kusama.url)` will grab metadata from Kusama network.\
By default, `ws://127.0.0.1:9944` is used.

`rpc-info`: metadata and couple of other bits


`rpc-events`: log of emitted events
Any argument is treated as module name to filter events with


`rpc-blocks`: log of produced blocks
* `--new` for subscribing to fresh blocks
* `--old` for dumping historical blocks
* `--all` for both historical blocks and new ones
* `--header` for displaying headers instead of hashes
* `--full` for displaying full content of blocks
* `--pretty` for pretty-printing jsons\
TODO: option for listing only finalized/non-finalized blocks


`rpc-contracts`: uploading, instantiating and calling smart contracts\
TODO: not implemented yet

# Uninstallation

To remove binaries from PATH:
```
yarn unlink
```
