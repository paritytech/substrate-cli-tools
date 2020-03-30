#!/bin/bash

set -e
root=$(git rev-parse --show-toplevel)
data=$root/data

rpc_contracts="$1contracts$2 -q" # remove "-q" to see verbose output

selector=123 #solang_bug: accepts any selector
#selector="d5311786"

$rpc_contracts deploy -f $data/solidity/wasm/Summator.wasm -g 12345
$rpc_contracts instantiate -h 0x49803e4720f9fd6edb897920575424a555365b19b757639f8b5c7754290f0573 -e 1234567DEV -g 1234567 -d 0x"$selector"

address=5CMgTCRgBaUTMuqCJi9PkDCCnM1WkRku7U9HNv1CBhAtHuH9
selector="40e4f0f7"

$rpc_contracts info -a $address 
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"01 -g 1234567
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"02 -g 1234567
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"03 -g 1234567
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"04 -g 1234567
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"05 -g 1234567
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"06 -g 1234567
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"07 -g 1234567
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"08 -g 1234567
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"09 -g 1234567
$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"10 -g 1234567
$rpc_contracts info -a $address 
echo "The result must be 0x37 (1+2+3+4+5+6+7+8+9+10=55)"

$rpc_contracts call -a $address -e 123DEV -d 0x"$selector"11 -g 1234567
$rpc_contracts info -a $address 
echo "The result must be 0x41 (2+3+4+5+6+7+8+9+10+11=65)"
