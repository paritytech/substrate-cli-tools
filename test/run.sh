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

filter_by=$1

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
        substrate_pid=""
    else
        echo "Running Substrate by path:"
        echo $1

        if [ -z $DEBUG ]; then
            level=info
        else
            level=debug
        fi

        $1 purge-chain --dev -y
        RUST_LOG=$level $1 --dev \
          --ws-port $SUBSTRATE_WS_PORT \
          --rpc-port $SUBSTRATE_HTTP_PORT \
        
        substrate_pid=$!
        substrate_cid=""
    fi
}

function stop_substrate {
    echo "Stopping Substrate instance"
    if [ -z "$substrate_cid" ]; then
        if [ -z "$substrate_pid" ]; then
            echo "Containers and processes should be already killed." | indent
        else
            echo "Killing substrate process $substrate_pid." | indent
            kill -9 $substrate_pid
        fi
    else
        echo "Stopping substrate container $substrate_cid." | indent
        $DOCKER stop $substrate_cid | indent
        substrate_cid=""

        if [ ! -z "$DEBUG" ]; then
            echo "[the container is not deleted due to debug mode]" | indent
        fi
    fi
}

function test_cases_exist {
    if [ -z $2 ]; then
        test_cases=$(ls -1 $1/*.sh)
    else
        test_cases=$(ls -1 $1/*.sh | grep $2)
    fi

    if [ -z "$test_cases" ]; then
        echo "There are no test cases in suite '$1'" ${2:+"matching $2"}

        return 1
    else
        echo "Test cases in suite '$1'" ${2:+"matching $2"}
        for t in $test_cases; do
            echo $t | indent
        done

        return 0
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

# with /bin/bash, EXIT includes INT, but this is not the case with /bin/sh
trap stop_substrate EXIT

if test_cases_exist contracts $filter_by; then
    start_substrate $SUBSTRATE_PATH
    test contracts $filter_by | indent
    stop_substrate
else
    echo "There are no test cases in 'contracts' matching '$filter_by'"
fi

echo

if test_cases_exist evm $filter_by; then
    start_substrate $SUBSTRATE_EVM_PATH
    test evm $filter_by | indent
    stop_substrate
else
    echo "There is no test cases in 'evm' matching '$filter_by'"
fi
