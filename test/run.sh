#!/bin/bash

set -e

root=$(git rev-parse --show-toplevel)

# TypeScript implementation
function prototype {
    cd $root/typescript
    yarn install 1>&2
    yarn run tsc 1>&2
    echo "$root/typescript/dist\njs"
    # prefix to look for executables
    # and extension of executables
}

# Rust implementation
function main {
    cd $root/rust
    cargo build --release 1>&2
    echo "$root/rust/target/release\n"
    # prefix to look for executables
    # and extension of executables
}

#impls="$(prototype) $(main)"
impls="$(prototype)"

###############################################################################

function start_substrate {
    echo "Running Substrate by path:"
    echo $1

    id=$(basename $1)

    $1 purge-chain --dev -y &> /dev/null
    $1 --dev &> $id.log &
    echo $! > $id.pid
}

function stop_substrate {
    echo "Stopping Substrate"
    id=$(basename $1)

    kill -9 $(cat $id.pid) &> /dev/null
    $1 purge-chain --dev -y
}

###############################################################################

alias indent="paste /dev/null -"

function test {
    echo "||| Running tests \"$1\""

    for impl in $impls
    do
        prefix=$(echo -e $impl | head -1)
        ext=$(echo -e $impl | tail -1)

        for test in $1/*.sh
        do
            echo -e "\t* Test $test"
            #$(command -v unbuffer) bash $test $prefix $ext | indent | indent
            bash $test $prefix $ext
            echo
        done
    done
}

WITH_CONTRACTS=$1
WITH_EVM=$2

function stop_all {
    for path in $WITH_CONTRACTS $WITH_EVM
    do
        stop_substrate $path
    done
}

trap stop_all INT

start_substrate $WITH_CONTRACTS
test contracts | indent
stop_substrate $WITH_CONTRACTS

start_substrate $WITH_EVM
test evm | indent
stop_substrate $WITH_EVM
