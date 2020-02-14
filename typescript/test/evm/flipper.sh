#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

u32_max="4294967295"
rpc_evm="yarn run ts-node src/evm.ts"

$rpc_evm deposit -a 100DEV
$rpc_evm create -e 10DEV -p 1 -g $u32_max -f $data/evm/flipper.json
