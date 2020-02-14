#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="yarn run ts-node src/contracts.ts"

$rpc_contracts -f $data/solang/flipper.wasm -g 12345 deploy
$rpc_contracts -h 0x0854f0d021cc0e5c7297e48b4360dca72edc8d99402f5500877d54b875932633 -e 1234567DEV instantiate -g 12345 -d 0xd531178600
$rpc_contracts call -a 5DV8tpyoGTtRsr9YFpFK2pzgN4AD1JjTv3SE1jYepuZ9Mdj7 -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a 5DV8tpyoGTtRsr9YFpFK2pzgN4AD1JjTv3SE1jYepuZ9Mdj7
