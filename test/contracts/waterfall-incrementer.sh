#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

cd $root/typescript

rpc_contracts="$1/contracts.$2"

$rpc_contracts deploy -f $data/waterfall/asmscript/incrementer.wasm -g 10000
$rpc_contracts instantiate -h 0x9a0671b9deaca4a70093fb4785e594229f012ed761c0074389a6b18da4e10d92 -e 1234567DEV -d 0x00 -g 1000000
$rpc_contracts call -a 5F68HE93fhyagn1DJw9zxqKLZZrdiwjSTyvZPs7c3WHwMavX -e 123DEV -d 0x002a000000 -g 1000000
$rpc_contracts info -a 5F68HE93fhyagn1DJw9zxqKLZZrdiwjSTyvZPs7c3WHwMavX
