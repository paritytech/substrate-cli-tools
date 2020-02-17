#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="yarn run ts-node src/contracts.ts"

$rpc_contracts -f $data/solang/flipper.wasm -g 12345 deploy
$rpc_contracts -h 0xe553a5690f471b9c110b8044a4db54510d60a30d5cc7925bf7582d177feeb748 -e 1234567DEV instantiate -g 12345 -d 0xd531178600
$rpc_contracts call -a 5DNB7xw6ko3jH1HubTj5Ch5no2Wn5pt2GwFYsZNr32xiVapL -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a 5DNB7xw6ko3jH1HubTj5Ch5no2Wn5pt2GwFYsZNr32xiVapL
$rpc_contracts call -a 5DNB7xw6ko3jH1HubTj5Ch5no2Wn5pt2GwFYsZNr32xiVapL -e 123DEV -d 0xa9efe4cd -g 1234567
$rpc_contracts info -a 5DNB7xw6ko3jH1HubTj5Ch5no2Wn5pt2GwFYsZNr32xiVapL
