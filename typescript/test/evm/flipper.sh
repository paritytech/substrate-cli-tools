#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

u32_max="4294967295"
rpc_evm="yarn run ts-node src/evm.ts"

$rpc_evm deposit -a 1000DEV
$rpc_evm create -e 10DEV -p 1 -g 1000000 -c `cat $data/evm/flipper.hex`
#$rpc_evm call -a 5DNB7xw6ko3jH1HubTj5Ch5no2Wn5pt2GwFYsZNr32xiVapL -e 124DEV -d 0xa9efe4cd -g 1234567
