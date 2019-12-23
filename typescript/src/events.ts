#!/usr/bin/env node

// @ts-ignore
const { ApiPromise } = require('@polkadot/api');
const { EventRecord } = require('@polkadot/api');
const { Vec } = require('@polkadot/types/interfaces');
// @ts-ignore
const { getWsProvider } = require('./common');

// @ts-ignore
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
