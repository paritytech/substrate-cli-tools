#!/bin/bash

root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="yarn run ts-node src/contracts.ts"

$rpc_contracts deploy -f $data/waterfall/asmscript/flipper.wasm -g 10000
$rpc_contracts instantiate -h 0x9d05d6eee1ebac5766dff2cf3a1ec5db53122a6e748434f3605aaeb3cd366bde -e 120DEV -d 0x00 -g 1000000
$rpc_contracts info -a 5GXcsavbbXfkyjz1ZDn4jmMko9HiKzpewg2HtpFLymMf649d
