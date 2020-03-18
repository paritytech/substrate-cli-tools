#!/bin/bash

# You can set following variables:
# SUBSTRATE_PATH for running your local Substrate instead of the containerized one
# SUBSTRATE_EVM_PATH for running your local Substrate instead of the containerized one

# SUBSTRATE_WS_PORT to change WebSockets port if it is already occupied
# SUBSTRATE_HTTP_PORT to change HTTP port if it is already occupied

if [ -z $SUBSTRATE_WS_PORT ]; then
    SUBSTRATE_WS_PORT=9944
fi
if [ -z $SUBSTRATE_HTTP_PORT ]; then
    SUBSTRATE_HTTP_PORT=9933
fi

source utils.sh

set -e

root=$(git rev-parse --show-toplevel)

#impls="$root/typescript/dist/\n.js $root/rust/target/release/"
impls="$root/typescript/dist/\n.js"

###############################################################################

substrate_cid=""

function start_substrate {
    if not-initialized "$1"; then
        echo "Running containerized Substrate"
        provide-container \
            "docker.io/parity/substrate:latest" \
            "Please specify the path to Substrate binary in the environment variable"

        substrate_cid=$($DOCKER run -dt --rm \
          -p $SUBSTRATE_WS_PORT:9944 \
          -p $SUBSTRATE_HTTP_PORT:9933 \
          parity/substrate:latest --dev \
          --ws-external --rpc-external)
    else
        echo "Running Substrate by path:"
        echo $1

        bin_id=$(basename $1)

        $1 purge-chain --dev -y
        $1 --dev \
          --ws-port $SUBSTRATE_WS_PORT \
          --rpc-port $SUBSTRATE_HTTP_PORT \
          &> id.log &
        echo $! > $bin_id.pid
    fi
}

function stop_substrate {
    echo "Stopping Substrate instance"
    if [ -z "$substrate_cid" ]; then
        echo $1 | indent
        bin_id=$(basename $1)

        kill -9 $(cat $bin_id.pid) &> /dev/null
    else
        $DOCKER stop $substrate_cid 
    fi
}

function test {
    echo "||| Running tests \"$1\""

    for impl in $impls
    do
        prefix=$(echo -e $impl | head -1)
        ext=$(echo -e $impl | tail -1)

        for test in `ls -1 $1/*.sh | grep -v disabled`
        do
            echo -e "\t* Test $test"
            $unbuf bash $test $prefix $ext | indent2
            echo
        done
    done
}

function stop_all {
    echo "Ctrl+C caught, shutting down running Substrate instances"
    if [ -z "$1$2" ]; then
        stop_substrate
    else
        for path in $1 $2
        do
            stop_substrate $path
        done
    fi
}

trap stop_all INT

start_substrate $SUBSTRATE_PATH
test contracts | indent
stop_substrate $SUBSTRATE_PATH

echo

start_substrate $SUBSTRATE_EVM_PATH
test evm | indent
stop_substrate $SUBSTRATE_EVM_PATH
