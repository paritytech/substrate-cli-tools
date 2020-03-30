# How to run tests?

The script `run.sh` will run all tests for both implementations
(prototype in TypeScript and main version in Rust). For testing
normal contracts and for testing EVM, two different Substrate
versions are used: plain substrate and substrate-evm-enabled fork.

By default, necessary versions are pulled via Podman/Docker:
```
./run.sh
```

### Custom node to test against

You can override variables `SUBSTRATE_PATH` and `SUBSTRATE_EVM_PATH` if you want to run tests
against your version of Substrate/EVM.

### Filtering

You can also specify pattern to filter test cases:
```
./run.sh solang-flipper
```
If a test suite is empty after filtering,
the corresponding Node will not be started.
