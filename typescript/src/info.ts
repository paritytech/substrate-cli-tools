#!/usr/bin/env node

import { ApiPromise } from "@polkadot/api";
import { getWsProvider } from "./utils/connection";
import { TYPES } from "./utils/types";

async function main() {
    const api = await ApiPromise.create(Object.assign(
        { provider: getWsProvider() },
        TYPES
    ));

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

    if (api.consts.babe) {
        const epochDuration = api.consts.babe.epochDuration;
        console.log("Epoch duration: ", epochDuration.toNumber());
    }

    console.log("Health: ", health.toString());
    console.log("Peers: ", peers.toString());
    console.log("Network state: ", network.toString());
    console.log("Properties: ", props.toString());
    console.log("Last timestamp: ", now.toNumber());

    console.log("Existential deposit: ", existentialDeposit.toNumber());
    console.log("Creation fee: ", creationFee);
}

main()
    .catch(console.error)
    .finally(() => process.exit());
