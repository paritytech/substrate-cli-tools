#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="$1contracts$2 -q" # remove "-q" to see verbose output

selector=123 #contracts_bug: Substrate accepts any number

$rpc_contracts deploy -f $data/solidity/wasm/Flipper_with_initvalue.wasm -g 12345
$rpc_contracts instantiate -h 0xb0af3c55f42bcb4aaf561844818531b6b71ddfaf01a6f1506c520dc05df66e0e -e 1234567DEV -g 1234567 -d 0x"$selector"00

address=5CUPHmoWhiVZwoYGFF6AyWeS79ULFcEfhQB5xs62jiV7tF8w

$rpc_contracts info -a $address 
$rpc_contracts call -a $address -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a $address 
$rpc_contracts call -a $address -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a $address 
