#!/usr/bin/env node

import { ApiPromise } from "@polkadot/api";
import { Vec } from "@polkadot/types";
import { EventRecord } from "@polkadot/types/interfaces";
import { getWsProvider } from "./utils/connection";
import { TYPES } from "./utils/types";

import chalk = require("chalk");

const WITH_DOCS = "--with-doc";
const DECODE_BYTES = "--decode-bytes";

async function main() {
    const usedArgs: Array<number> = [0, 1];

    let withDocs = process.argv.includes(WITH_DOCS);
    if (withDocs) {
        usedArgs.push(process.argv.findIndex((arg) => arg === WITH_DOCS));
    }

    const decoder = new TextDecoder("utf-8");
    const eventsToDecode: Array<string> = [];
    if (process.argv.includes(DECODE_BYTES)) {
        //Now we are remembering names of events which must contain text fields
        //and hence be decoded later. List of such events must either consist of single item
        //or be embraced with '[' and ']'

        let i = process.argv.findIndex((arg) => arg === DECODE_BYTES);
        usedArgs.push(i);

        i = i + 1;
        let raw = process.argv[i];

        if (raw.startsWith('[')) {
            raw = raw.substr(1);
            while (!raw.endsWith(']')) {
                eventsToDecode.push(raw);
                usedArgs.push(i);

                i = i + 1;
                raw = process.argv[i];
            }

            const last = raw.substr(0, raw.length - 1);
            usedArgs.push(i);

            if (last !== "") {
                eventsToDecode.push(last);
            } else {
                warning(chalk.yellow(`Empty list passed to ${DECODE_BYTES} option`));
            }
        } else if (!raw.endsWith(']')) {
            if (raw.startsWith('+') || raw.startsWith('-')) {
                error(chalk.red(`Malformed syntax of ${DECODE_BYTES} arguments`));
            }
            eventsToDecode.push(raw);
            usedArgs.push(i);
        } else {
            error(chalk.red(`Malformed syntax of ${DECODE_BYTES} arguments`));
        }
    }
    console.log("Events with fields to decode:", eventsToDecode);

    const modulesToFilter: Array<string> = process.argv
        .filter((arg, i) => !usedArgs.includes(i));
    console.log("Filters:", modulesToFilter);

    const positive = modulesToFilter.filter((s) => s.startsWith("+")).map((s) => s.substr(1));
    const negative = modulesToFilter.filter((s) => s.startsWith("-")).map((s) => s.substr(1));

    const negativeFiltering = negative.length > 0;
    const positiveFiltering = positive.length > 0;

    if (positive.length > 0 && negative.length > 0) {
        error("Using positive and negative filters at the same time makes no sense");
    }

    if (positive.length + negative.length < modulesToFilter.length) {
        error("Ambiguous filter encountered, you must specify explicitly how to use it (+ or -)");
    }

    const api = new ApiPromise({
        provider: getWsProvider(),
        typesChain: TYPES,
    });
    await api.isReady;

    api.query.system.events((events: Vec<EventRecord>) => {
        let matchedEvents = 0;
        events.forEach((record) => {
            const { event, phase } = record;
            const module = event.section;

            if (positiveFiltering && positive.includes(module)
                || negativeFiltering && !negative.includes(module)
                || positiveFiltering === negativeFiltering) {

                console.log(
                    chalk.bold.black.bgWhite(`[${event.section}]`) + " " +
                    chalk.bold.yellow.bgBlue(event.method) + " " +
                    `(phase=${phase.toString()})`);

                if (withDocs) {
                    console.log(`Docs: ${event.meta.documentation.toString()}`);
                }

                const types = event.typeDef;
                event.data.forEach((data, index: number) => {
                    const type = types[index].type;
                    let label = type;

                    let value;
                    if (type === "Bytes" && eventsToDecode.includes(event.method)) {
                        value = decoder.decode(data.toU8a());
                        label = "Bytes [UTF-8]";
                    } else {
                        value = data.toString();
                    }

                    console.log(`\t${label}: ${value}`);
                });

                matchedEvents += 1;
            }
        });

        if (matchedEvents > 0) {
            console.log(`(${matchedEvents} matching events received)\n`);
        }
    });
}

function error(message: string) {
    console.error(chalk.red(message));
    process.exit(-1);
}

function warning(message: string) {
    console.error(chalk.yellow(message));
}

main().catch((e) => {
    error(e);
});
