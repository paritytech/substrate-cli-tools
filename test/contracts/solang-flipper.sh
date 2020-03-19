#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="$1contracts$2"

$rpc_contracts deploy -f $data/solidity/wasm/flipper2.wasm -g 12345
$rpc_contracts instantiate -h 0x122af688a6d50429743a5667e0b526ee466ae8806b3ad9243652576b7ff6215e -e 1234567DEV -g 1234567 -d 0xd531178600
$rpc_contracts call -a 5E6FvQHLAP4RYwhERicUYuGXS5N6S4N1H9X9YDJ23bsgTiWf -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a 5E6FvQHLAP4RYwhERicUYuGXS5N6S4N1H9X9YDJ23bsgTiWf
$rpc_contracts call -a 5E6FvQHLAP4RYwhERicUYuGXS5N6S4N1H9X9YDJ23bsgTiWf -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a 5E6FvQHLAP4RYwhERicUYuGXS5N6S4N1H9X9YDJ23bsgTiWf 
