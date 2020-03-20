#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="$1contracts$2"

$rpc_contracts deploy -f $data/solidity/wasm/flipper2.wasm -g 12345
$rpc_contracts instantiate -h 0xb0af3c55f42bcb4aaf561844818531b6b71ddfaf01a6f1506c520dc05df66e0e -e 1234567DEV -g 1234567 -d 0xd531178600
$rpc_contracts call -a 5FcLptcmTbGgsitNxknK1TgwYA5KjwdSi6RFoFRuWrWxRLdm -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a 5FcLptcmTbGgsitNxknK1TgwYA5KjwdSi6RFoFRuWrWxRLdm
$rpc_contracts call -a 5FcLptcmTbGgsitNxknK1TgwYA5KjwdSi6RFoFRuWrWxRLdm -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a 5FcLptcmTbGgsitNxknK1TgwYA5KjwdSi6RFoFRuWrWxRLdm
