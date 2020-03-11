# How to run tests?

The script `run.sh` will run all tests for both implementations
(prototype in TypeScript and main version in Rust). For testing
normal contracts EVM and testing EVM two different Substrate
versions are used: plain substrate and fork of node-template.

This will change when I move EVM from `node-template` to `node`,
then the same executable will have both modules.

```
./run.sh <path1> <path2>
```
