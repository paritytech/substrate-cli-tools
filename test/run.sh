#!/bin/bash

# You can set following variables:
# SUBSTRATE_PATH for running your local Substrate instead of the containerized one
# SUBSTRATE_EVM_PATH for running your local Substrate instead of the containerized one

# SUBSTRATE_WS_PORT to change WebSockets port if it is already occupied
# SUBSTRATE_HTTP_PORT to change HTTP port if it is already occupied

if [[ $@ == *"--debug"* ]]; then
    echo "[debug mode on]"
    DEBUG=true
fi

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

substrate_cid=""

function start_substrate {
    substrate_image="docker.io/parity/substrate:latest"
    couldnt_find_message="Please specify the path to Substrate binary in the environment variable"

    if not-initialized "$1"; then
        echo "Running containerized Substrate"
        provide-container $substrate_image $couldnt_find_message

        if [ -z $DEBUG ]; then
            docker_extra="--rm"
        else
            docker_extra="-e RUST_LOG=debug"
        fi

        substrate_cid=$($DOCKER run -dt $docker_extra \
          -p $SUBSTRATE_WS_PORT:9944 \
          -p $SUBSTRATE_HTTP_PORT:9933 \
          $substrate_image --dev \
          --ws-external --rpc-external)
    else
        echo "Running Substrate by path:"
        echo $1

        bin_id=$(basename $1)

        if [ -z $DEBUG ]; then
            level=info
        else
            level=debug
        fi

        $1 purge-chain --dev -y
        RUST_LOG=$level $1 --dev \
          --ws-port $SUBSTRATE_WS_PORT \
          --rpc-port $SUBSTRATE_HTTP_PORT \
          &> $bin_id.log &
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

        if [ ! -z "$DEBUG" ]; then
            echo "[the container is not deleted due to debug mode]"
        fi
    fi
}

function test {
    echo "||| Running tests \"$1\" with filter \"$2\""

    for impl in $impls
    do
        prefix=$(echo -e $impl | head -1)
        ext=$(echo -e $impl | tail -1)

        if [ -z "$2" ]; then
            filter="grep -v disabled"
        else
            filter="grep $2"
        fi

        for test in `ls -1 $1/*.sh | $filter`
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
test contracts $1 | indent
stop_substrate $SUBSTRATE_PATH

echo

start_substrate $SUBSTRATE_EVM_PATH
test evm $1 | indent
stop_substrate $SUBSTRATE_EVM_PATH
