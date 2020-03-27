#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="$1contracts$2 -q"

initvalue=0x1337 #contracts_bug: Substrate accepts any value here

$rpc_contracts deploy -f $data/waterfall/asmscript/flipper.wasm -g 12345
$rpc_contracts instantiate -h 0x9d05d6eee1ebac5766dff2cf3a1ec5db53122a6e748434f3605aaeb3cd366bde -e 12345DEV -g 123456 -d $initvalue

address=5EJ3mHgYzSE9TKrEZUiGNu3fRJkGerQwb5J91ZFdQN64Hsxw

$rpc_contracts info -a $address
$rpc_contracts call -a $address -e 123DEV -d 0x00 -g 1234567
$rpc_contracts info -a $address
$rpc_contracts call -a $address -e 123DEV -d 0x00 -g 1234567
$rpc_contracts info -a $address
