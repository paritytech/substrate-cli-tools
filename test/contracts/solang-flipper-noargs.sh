#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

rpc_contracts="$1contracts$2 -q" # remove "-q" to see verbose output

selector=123 #solang_bug: accepts any selector

$rpc_contracts deploy -f $data/solidity/wasm/Flipper_no_args.wasm -g 12345
$rpc_contracts instantiate -h 0x9498960359c5cb825ccc10d4c7ae50bfd4264a6a115a9390ddaebd276635d05a -e 1234567DEV -g 1234567 -d 0x"$selector"

address=5GMgqHXTSBVxgd7LWKm8zCzCedi1X6w5AWoZfMcmpEQzZ9g2

$rpc_contracts info -a $address 
$rpc_contracts call -a $address -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a $address 
$rpc_contracts call -a $address -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a $address 
