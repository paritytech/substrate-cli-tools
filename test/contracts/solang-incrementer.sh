#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

rpc_contracts="$1contracts$2 -q" # remove "-q" to see verbose output

selector=123 #solang_bug: accepts any selector

$rpc_contracts deploy -f $data/solidity/wasm/Incrementer.wasm -g 12345
$rpc_contracts instantiate -h 0xf030ffd7093148f34bf5ac3092dec596bc57e20e2c925d8865b20e83c2c91a06 -e 1234567DEV -g 1234567 -d 0x"$selector"00

address=5GySUBy91ZpK7WV1JYgvz96Dk7M7M6es3Nt9RYPWBsgtsQh9

$rpc_contracts info -a $address 
exit 1
$rpc_contracts call -a $address -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a $address 
$rpc_contracts call -a $address -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a $address 
