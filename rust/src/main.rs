use std::{fs, io::Read, path::PathBuf};

use sp_core::{crypto::Pair, sr25519, H256};
use parity_scale_codec::{
    Codec
};
use sp_runtime::{
    MultiSignature,
    traits::{
        IdentifyAccount,
        Verify,
    }
};
use subxt::{
    contracts,
    system::System,
    balances::Balances,
    DefaultNodeRuntime,
    ExtrinsicSuccess,
    XtBuilder
};

use anyhow::{Context, Result};
use futures::future::Future;
use tokio::runtime::Runtime as TokioRT;

type Signer = sr25519::Pair;
type Client = subxt::Client<DefaultNodeRuntime, MultiSignature>;
type DefaultXtBuilder = XtBuilder<DefaultNodeRuntime,Signer,MultiSignature>;

fn main() {
    let mut args = std::env::args();
    args.next();

    let path = args.next().unwrap_or_else(|| {
        println!("Path to the WASM binary expected.");
        std::process::exit(64);
    });

    let path = PathBuf::from(path);
    println!("Loading WASM binary by path: {:?}", &path);
    let wasm = load_contract_code(&path).unwrap();
    println!("WASM binary loaded");

    let url = url::Url::parse("ws://127.0.0.1:9944").unwrap();

    let mut rt = tokio::runtime::Runtime::new().unwrap();

    let client: Client = rt.block_on(subxt::ClientBuilder::<DefaultNodeRuntime>::new()
            .set_url(url)
            .build())
        .unwrap();

    let alice = sr25519::Pair::from_string("//Alice", None).unwrap();
    let xt: DefaultXtBuilder = rt.block_on(client.xt(alice.clone(), None)).unwrap();

    let code_hash = deploy(&xt, &mut rt, 500_000, wasm).unwrap();
    println!("Contract deployed: {:?}", &code_hash);

    let xt: DefaultXtBuilder = rt.block_on(client.xt(alice, None)).unwrap();

    let existential_deposit = 100_000_000_000_000;
    let data = vec![0xF8, 0x1E, 0x7E, 0x1A, 0x0];

    let address = instantiate(&xt, &mut rt, 2 * existential_deposit, 500_000, &code_hash, data).unwrap();
    println!("Contract instantiated: {:?}", &address);

    for method in args {
        //todo: so far, it is supposed to be used only with 0-ary methods
        let result = call(&xt, &mut rt, 500_000, &code_hash, &method).unwrap();
    }
}

fn deploy(
    xt: &DefaultXtBuilder, rt: &mut TokioRT,
    gas_limit: u64, wasm: Vec<u8>,
) -> Result<H256> {
    rt.block_on(xt.submit_and_watch(contracts::put_code(gas_limit, wasm)))
        .map_err(|e| anyhow::anyhow!("Deploy error: {:?}", e))
        .and_then(|x| extract_code_hash(x))
}

fn instantiate(
    xt: &DefaultXtBuilder, rt: &mut TokioRT,
    endowment: u128, gas_limit: u64,
    code_hash: &H256, data: Vec<u8>
) -> Result<H256> {
    rt.block_on(xt.submit_and_watch(contracts::instantiate::<DefaultNodeRuntime>(endowment, gas_limit, *code_hash, data)))
        .map_err(|e| anyhow::anyhow!("Instantiation error: {:?}", e))
        .and_then(|x| extract_instance_address(x))
}

fn call(
    xt: &DefaultXtBuilder, rt: &mut TokioRT,
    gas: u64, code_hash: &H256,
    method: &str
) -> Result<String> {
    unimplemented!()
}

fn load_contract_code(path: &PathBuf) -> Result<Vec<u8>> {
    let mut data = Vec::new();
    let mut file = fs::File::open(&path)
        .context(format!("Failed to open {}", path.display()))?;
    file.read_to_end(&mut data)?;
    Ok(data)
}

fn extract_code_hash<T: System>(extrinsic_result: ExtrinsicSuccess<T>) -> Result<H256> {
    match extrinsic_result.find_event::<H256>("Contracts", "CodeStored") {
        Some(Ok(hash)) => Ok(hash),
        Some(Err(err)) => Err(anyhow::anyhow!("Failed to decode code hash: {}", err)),
        None => Err(anyhow::anyhow!(
            "Failed to find Contracts::CodeStored event"
        )),
    }
}

fn extract_instance_address<T: System>(extrinsic_result: ExtrinsicSuccess<T>) -> Result<H256> {
    match extrinsic_result.find_event::<H256>("Balances", "NewAccount") {
        Some(Ok(hash)) => Ok(hash),
        Some(Err(err)) => Err(anyhow::anyhow!("Failed to decode account details: {}", err)),
        None => Err(anyhow::anyhow!(
            "Failed to find Balances::NewAccount event"
        )),
    }
}
