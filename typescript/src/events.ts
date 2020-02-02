#!/usr/bin/env node

import { ApiPromise } from "@polkadot/api";
import { Vec } from "@polkadot/types";
import { EventRecord } from "@polkadot/types/interfaces";
import { getWsProvider } from "./utils/connection";
import { CUSTOM_TYPES } from "./utils/types";

async function main() {
    const api = new ApiPromise({
        provider: getWsProvider(),
        types: CUSTOM_TYPES,
    });
    await api.isReady;

    const filters = process.argv.slice(2);
    const displayAll = filters.length === 0;

    api.query.system.events((events: Vec<EventRecord>) => {
        let matchedEvents = 0;
        events.forEach((record) => {
            const { event, phase } = record;

            if (displayAll || filters.includes(event.section)) {
                console.log(`${event.section}:${event.method}:: (phase=${phase.toString()})`);
                console.log(`\t${event.meta.documentation.toString()}`);

                const types = event.typeDef;
                event.data.forEach((data, index: number) => {
                    console.log(`\t\t${types[index].type}: ${data.toString()}`);
                });

                matchedEvents += 1;
            }
        });

        if (matchedEvents > 0) {
            console.log(`(${matchedEvents} matching events received)\n`);
        }
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
