#!/bin/bash

root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="yarn run ts-node src/contracts.ts"

$rpc_contracts -f $data/solang/flipper-defaultval.wasm -g 10000 deploy
$rpc_contracts -h 0x2ac97bf729165e0a36840c20de402d80bbfd683e8d2e0e76a357061fbd3f3d8c -e 120DEV instantiate -g 10000 -d f81e7e1a
