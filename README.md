Small console toolset for getting information about Substrate nodes and working with smart contracts.\
At the moment, implemented in Typescript. In future, it is going to be ported to Rust with usage of `substrate-subxt`.

# Installation

Add yarn binaries folder into yout PATH:
```
echo "export PATH=$(yarn global bin):$PATH" >> ~/.bashrc
source ~/.bashrc
```

Link binaries into yarn folder:
```
cd typescript
yarn install
yarn run tsc
./bind.sh
```

# Tools

All binaries accept `--url` option for selecting node.\
E.g. `rpc-info --url $(cat kusama.url)` will grab metadata from Kusama network.\
By default, `ws://127.0.0.1:9944` is used.

**`rpc-info`: metadata and couple of other bits**


**`rpc-events`: log of emitted events**\
Any argument is treated as module name to filter events with.\
It must be prefixed with **`+`** or **`-`** to determine mode of filtering.\
Use `--decode-bytes MyEvent` or `--decode-bytes [Event1 Event2 Event3]`\
to decode byte fields with UTF-8 encoded text into human-readable text.


**`rpc-balances`: subscribe to balances changes**\
Provide a list of accounts to monitor, URIs like `//Alice` are also supported.
* `--evm` for monitoring EVM balances


**`rpc-blocks`: log of produced blocks**
* `--new` for subscribing to fresh blocks
* `--old` for dumping historical blocks
* `--all` for both historical blocks and new ones
* `--header` for displaying headers instead of hashes
* `--full` for displaying full content of blocks
* `--pretty` for pretty-printing jsons


**`rpc-transfer`: transfer funds between accounts**\
Example: `rpc-transfer //Alice 1DEV //Bob`


**`rpc-contracts`: uploading, instantiating and calling smart contracts**
* `-s`, `--seed`: specifies key to sign transactions
* `-g`, `--gas`: specifies gas limit for any supported operation
* **`deploy`** uploads contract code to the chain
* `-f`, `--file`: path to the code
* **`instantiate`** uses uploaded code and creates an instance of the contract
* `-h`, `--hash`: refers to the code stored on-chain
* `-e`, `--endowment`: amount to transfer with this operation
* `-d`, `--data`: SCALE-encoded data to transfer with this operation
* **`call`** runs a method attached to the contract, possibly transfers funds as well
* `-a`, `--address`: address of the contract to call
* `-e`, `--endowment`: amount to transfer with this operation
* `-d`, `--data`: SCALE-encoded data to transfer with this operation
* **`info`** retrieves information and all storage entries of the contract
* `-a`, `--address`: address of the contract to inspect


**`rpc-evm`: creating/calling contracts and depositing/withdrawing EVM accounts**
* `-s`, `--seed`: specifies key to sign transactions
* **`create`** uploads contract code to the chain
* `-f`, `--file`: path to the code (you can use `-c` as well)
* `-c`, `--code`: hex-encoded code (you can use `-f` as well)
* `-e`, `--endowment`: amount to transfer with this operation
* `-p`, `--price`: gas price
* `-g`, `--gas`: gas limit
* **`call`** runs a method attached to the contract, possibly transfers funds as well
* `-a`, `--address`: address of the contract to call
* `-d`, `--data`: data to transfer with this operation
* `-e`, `--endowment`: amount to transfer with this operation
* `-p`, `--price`: gas price
* `-g`, `--gas`: gas limit
* **`info`** retrieves a single (so far) storage entry by its index
* `-a`, `--address`: address of the contract to inspect
* `-i`, `--index`: index of the entry to retrieve
* **`deposit`** refills EVM balance using Substrate balance
* `-a`, `--amount`: amount to deposit
* **`withdraw`** refills Substrate balance using EVM balance
* `-a`, `--amount`: amount to withdraw
* **`selector`** emits first 10 characters of Keccak hash,\
   use this with function signatures like `flip()`

# Uninstallation

To remove binaries from PATH:
```
yarn unlink
```
