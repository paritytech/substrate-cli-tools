# Running tests

Tests are plain bash scripts located under `test` folder.
You still need to have `yarn` to run them.

```
test/waterfall/asmscript/flipper.sh
test/solang/flipper.sh
test/evm/flipper.sh
```

# Reminder about installation

```
echo "export PATH=$(yarn global bin):$PATH'" >> ~/.bashrc
source ~/.bashrc
yarn install
yarn run tsc
./bind.sh
```
