#!/bin/bash

YARN_BIN="$HOME/.yarn/bin"
LINK_DIR="$HOME/.config/yarn/link/substrate-cli-tools/dist"
TOOLS="info events blocks balances transfer contracts evm"

yarn unlink --silent 2> /dev/null

for tool in $TOOLS
do
    chmod +x dist/$tool.js
done

yarn link --silent

for tool in $TOOLS
do
    ln -sf $LINK_DIR/$tool.js $YARN_BIN/rpc-$tool
done
