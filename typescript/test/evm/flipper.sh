#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_evm="yarn run ts-node src/evm.ts"
rpc_evm_silent="yarn -s run ts-node src/evm.ts"

$rpc_evm deposit -a 1000DEV
$rpc_evm create -e 10DEV -p 1 -g 500000 -c `cat $data/evm/flipper.hex`

flip=$($rpc_evm_silent selector "flip()")

$rpc_evm call -e 1DEV -p 1 -g 500000 -a 0x11650d764feb44f78810ef08700c2284f7e81dcb -d $flip
$rpc_evm info -a 0x11650d764feb44f78810ef08700c2284f7e81dcb -i 0x0000000000000000000000000000000000000000000000000000000000000000
$rpc_evm call -e 1DEV -p 1 -g 500000 -a 0x11650d764feb44f78810ef08700c2284f7e81dcb -d $flip
$rpc_evm info -a 0x11650d764feb44f78810ef08700c2284f7e81dcb -i 0x0000000000000000000000000000000000000000000000000000000000000000
