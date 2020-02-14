#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="yarn run ts-node src/contracts.ts"

$rpc_contracts deploy -f $data/ink/flipper.wasm -g 123456
$rpc_contracts instantiate -h 0x664c16bf52d4456dc626ca45908bf9299494f31e9ea2c22913d2afbca2d975ff -e 1234567DEV -d 0x0222ff18 -g 1234567
$rpc_contracts call -a 5Eo7iw14JNyCsveTy9PFyFCU91SegFAagDJpg2P6FLVNwdGg -e 123DEV -d 0x8c97db39 -g 1000000
$rpc_contracts info -a 5Eo7iw14JNyCsveTy9PFyFCU91SegFAagDJpg2P6FLVNwdGg
