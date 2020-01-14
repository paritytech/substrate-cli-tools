#!/usr/bin/env node

import { ApiPromise } from "@polkadot/api";
import { Vec } from "@polkadot/types";
import { EventRecord } from "@polkadot/types/interfaces";
import { getWsProvider } from "./common";

async function main() {
    const api = new ApiPromise({ provider: getWsProvider() });
    await api.isReady;

    api.query.system.events((events: Vec<EventRecord>) => {
        console.log(`Received ${events.length} events:`);

        events.forEach((record) => {
            const { event, phase } = record;

            // if (event.section == "contracts") {
            console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
            console.log(`\t\t${event.meta.documentation.toString()}`);

            const types = event.typeDef;
            event.data.forEach((data, index: number) => {
                console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
            });
            // }
        });

        console.log("\n");
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
