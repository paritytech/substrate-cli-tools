#!/bin/bash

source utils.sh

provide-solc
provide-solang

root=$(git rev-parse --show-toplevel)

# Building contracts to test

cd "$root"/data/solidity

rm -rf evm wasm
mkdir evm wasm

for src in $(ls -1 ./*.sol | grep -v disabled)
do
    echo "Compiling $src"

    echo "solc:" | indent
    solc --bin -o evm "$src" | indent2

    echo "solang:" | indent
    solang -o wasm "$src" | indent2
done


# Building prototype implementation (Typescript)

cd "$root"/typescript
yarn install 1>&2
yarn run tsc 1>&2
chmod +x dist/*.js


## Building main implementation (Rust)

#cd $root/rust
#cargo build --release 1>&2
