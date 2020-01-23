YARN_BIN="$HOME/.yarn/bin"
LINK_DIR="$HOME/.config/yarn/link/substrate-cli-tools/dist"
TOOLS="info balances events blocks contracts"

yarn unlink &> /dev/null

for tool in $TOOLS
do
    chmod +x dist/$tool.js
done

yarn link &> /dev/null

for tool in $TOOLS
do
    ln -sf $LINK_DIR/$tool.js $YARN_BIN/rpc-$tool
done
