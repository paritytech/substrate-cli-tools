import { Keyring } from "@polkadot/keyring";
import { blake2AsHex } from "@polkadot/util-crypto";

export function constructLabel(id: string): string {
    if (id.startsWith("/")) {
        return id;
    }

    return shorten(id);
}

export function unfoldId(keyring: Keyring, id: string): string {
    if (id.startsWith("/")) {
        return keyring.addFromUri(id).address;
    }

    return id;
}

export function computeEvmId(keyring: Keyring, address: string): string {
    const bytes = keyring.decodeAddress(address);
    const hex = blake2AsHex(bytes, 256);
    console.assert(hex.length === 66); // 0x + 32 bytes
    return hex.substring(2 + 24); // skipping 12 bytes
}

function shorten(long: string): string {
    const n = long.length;
    return long.substr(0, 4) + "..."
        + long.substr(n - 1 - 4, 4);
}
