#!/usr/bin/env node

// @ts-ignore
const { ApiPromise } = require("@polkadot/api");
// @ts-ignore
const { getWsProvider } = require("./common");

// @ts-ignore
async function main() {
    const api = await ApiPromise.create({ provider: getWsProvider() });

    const epochDuration = api.consts.babe.epochDuration;
    const creationFee = api.consts.balances.creationFee;
    const existentialDeposit = api.consts.balances.existentialDeposit;

    const [now, chain, name, health, network, peers, props, version, meta] =
        await Promise.all([
            api.query.timestamp.now(),
            api.rpc.system.chain(),
            api.rpc.system.name(),
            api.rpc.system.health(),
            api.rpc.system.networkState(),
            api.rpc.system.peers(),
            api.rpc.system.properties(),
            api.rpc.system.version(),
            api.rpc.state.getMetadata(),
        ]);

    console.log(JSON.stringify(meta, null, 2));
    console.log("Name: ", name.toString());
    console.log("Version: ", version.toString());
    console.log("Chain name: ", chain.toString());
    console.log("Epoch duration: ", epochDuration.toNumber());
    console.log("Creation fee: ", creationFee.toNumber());
    console.log("Existential deposit: ", existentialDeposit.toNumber());
    console.log("Health: ", health.toString());
    console.log("Peers: ", peers.toString());
    console.log("Network state: ", network.toString());
    console.log("Properties: ", props.toString());
    console.log("Last timestamp: ", now.toNumber());
}

main()
    .catch(console.error)
    .finally(() => process.exit());
