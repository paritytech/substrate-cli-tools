import { ApiPromise, SubmittableResult } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Option, StorageData } from "@polkadot/types";
import { Address, ContractInfo, Hash } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
import { sendAndReturnFinalized } from "./signer";
import BN from "bn.js";
import fs from "fs";

const blake = require("blakejs");

function reportFailure(operation: string, result: SubmittableResult) {
  const failure = result.findRecord("system", "ExtrinsicFailed");
  if (failure) {
    console.error("ExtrinsicFailed", JSON.stringify(failure, null, 2));
  }
  throw new Error(`${operation} failed.`);
}

export async function upload(
  api: ApiPromise,
  signer: KeyringPair,
  filePath: string,
  gas: number,
): Promise<Hash> {
  const wasmCode = fs
    .readFileSync(filePath)
    .toString("hex");
  const tx = api.tx.contracts.putCode(gas, `0x${wasmCode}`);
  const result: any = await sendAndReturnFinalized(signer, tx);
  const record = result.findRecord("contracts", "CodeStored");

  if (!record) {
    reportFailure("Deployment", result);
  }
  // Return code hash.
  return record.event.data[0];
}

export async function instantiate(
  api: ApiPromise,
  signer: KeyringPair,
  codeHash: Hash,
  inputData: any,
  endowment: BN,
  gas: number,
): Promise<Address> {
  const tx = api.tx.contracts.instantiate(
    endowment,
    gas,
    codeHash,
    inputData,
  );
  const result: any = await sendAndReturnFinalized(signer, tx);
  const record = result.findRecord("contracts", "Instantiated");

  if (!record) {
    reportFailure("Instantiation", result);
  }
  // Return the address of instantiated contract.
  return record.event.data[1];
}
