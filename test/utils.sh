#!/bin/bash

function provide-container {
    if which podman; then
        export DOCKER="podman"
    elif which docker; then
        "Docker detected, consider installing Podman to avoid typing a password"
        export DOCKER="sudo docker"
    else
        >&2 echo "$2"
        >&2 echo "OR install Docker (you can also use Podman with DOCKER=podman)"
        exit 1
    fi

    if ! $DOCKER image exists "$1"; then
        $DOCKER image pull "$1"
    fi
}

function not-initialized {
    if [ -n "$1" ] && [ ! -f "$1" ]; then
        >&2 echo "$1 doesn't exist"
        exit 2 # user pretends to know what he is doing,
               # but the path is incorrect
    fi

    if [ -z "$1" ]; then
        # we can perform auto-initialization
        return 0
    fi

    # the variable is correctly initialized
    return 125 
}

function provide-solang {
    # we are good only with the latest or explicitly specified Solang
    if not-initialized "$SOLANG_PATH"; then
        solang_image="docker.io/hyperledgerlabs/solang:latest"
        couldnt_find_message="Please specify the path to Solang in the SOLANG_PATH environment variable"
        provide-container $solang_image "$couldnt_find_message"

        function solang { $DOCKER run -it --rm -v "$PWD":/x:z -w /x $solang_image "$@" && echo ok; }
    else
        function solang { $SOLANG_PATH "$@"; }
    fi

    export -f solang
}

function provide-solc {
    solc_image="docker.io/ethereum/solc:stable"
    couldnt_find_message="Please specify the path to Solc in the SOLC_PATH environment variable"

    # we are good only with the latest stable or explicitly specified Solc
    if not-initialized "$SOLC_PATH"; then
        provide-container $solc_image "$couldnt_find_message"

        function solc { $DOCKER run -it --rm -v "$PWD":/x:z -w /x $solc_image "$@" 1> /dev/null && echo ok; }
    else
        function solc { $SOLANG_PATH "$@"; }
    fi

    export -f solc
}



if [ -z "$(command -v unbuffer)" ]
then
    echo "(Install utility 'unbuffer' from package 'expect' for pretty output)"
    unbuf="stdbuf -oL -eL"
    unbufp="stdbuf -oL -eL"
else
    unbuf="unbuffer"
    unbufp="unbuffer -p"
fi

function indent { sed -u 's/^/    /' "$@"; }

function indent2 { sed -u 's/^/    \.   /' "$@"; }

function indent3 { sed -u 's/^/    .   .   /' "$@"; }