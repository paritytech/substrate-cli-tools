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
chmod +x dist/info.js dist/events.js dist/blocks.js
yarn link
```

# Tools

All binaries accept `--url` option for selecting node.\
E.g. `rpc-info --url $(cat kusama.url)` will grab metadata from Kusama network.\
By default, `ws://127.0.0.1:9944` is used.

`rpc-blocks`: log of produced blocks
* `--all` for listing historical blocks first
* `--header` for displaying headers instead of hashes
* `--full` for displaying full content of blocks
* `--pretty` for pretty-printing jsons\
TODO: option for listing only finalized/non-finalized blocks


`rpc-events`: log of emitted events\
TODO: filtering


`rpc-info`: metadata and couple of other bits

# Uninstallation

To remove binaries from PATH:
```
yarn unlink
```
