use std::sync::Arc;

use abstract_core::ans_host::{
    AssetPairingFilter, ExecuteMsg, PoolAddressListResponse, PoolMetadataListResponse, QueryMsgFns,
};
use abstract_core::ans_host::ExecuteMsgFns;
use abstract_core::objects::pool_id::UncheckedPoolAddress;
use abstract_interface::Abstract;
use clap::Parser;
use cw_orch::contract::Deploy;
use cw_orch::daemon::{ChainInfo, ChainKind, DaemonBuilder};
use cw_orch::daemon::networks::{JUNO_1, parse_network};
use cw_orch::daemon::networks::neutron::NEUTRON_NETWORK;
use tokio::runtime::Runtime;

use dangerous_ans_scripts::PION_1;

/// Script that takes all pools in ANS and deletes them
fn delete_pools(args: Arguments) -> anyhow::Result<()> {
    let rt = Arc::new(Runtime::new()?);

    let chain = DaemonBuilder::default()
        .handle(rt.handle())
        .chain(PION_1)
        // .chain(parse_network(&args.network_id))
        .build()?;

    let deployment = Abstract::load_from(chain)?;

    let mut all_pool_metadatas = vec![];

    let mut last_pool_id = None;

    loop {
        let PoolMetadataListResponse { mut metadatas } =
            deployment
                .ans_host
                .pool_metadata_list(None, None, last_pool_id)?;
        if metadatas.is_empty() {
            break;
        }
        all_pool_metadatas.append(&mut metadatas);
        last_pool_id = all_pool_metadatas.last().map(|(id, _)| id.to_owned());
    }

    let mut pool_ids_to_remove = vec![];

    for (pool_id, metadata) in all_pool_metadatas.clone() {
        pool_ids_to_remove.push(pool_id);
    }

    println!("Removing {} pools", pool_ids_to_remove.len());
    println!("Removing pools: {:?}", pool_ids_to_remove);

    // chain.wait_blocks(500).unwrap();


    // remove the pools
    deployment
        .ans_host
        .execute_chunked(&pool_ids_to_remove, 15, |chunk| ExecuteMsg::UpdatePools {
            to_add: vec![],
            to_remove: chunk.to_vec(),
        })?;

    Ok(())
}

#[derive(clap::Parser, Default, Debug)]
#[command(author, version, about, long_about = None)]
struct Arguments {
    /// Network to run script
    #[arg(short, long)]
    network_id: String,

    /// Force user to say they're sure
    #[arg(long)]
    yes_im_sure: bool,
}

fn main() {
    dotenv().ok();
    env_logger::init();

    use dotenv::dotenv;

    let args = Arguments::parse();

    if !args.yes_im_sure {
        panic!("Include --yes-im-sure to run dangerous pool deletion script");
    }


    if let Err(ref err) = delete_pools(args) {
        log::error!("{}", err);
        err.chain()
            .skip(1)
            .for_each(|cause| log::error!("because: {}", cause));

        // The backtrace is not always generated. Try to run this example
        // with `$env:RUST_BACKTRACE=1`.
        //    if let Some(backtrace) = e.backtrace() {
        //        log::debug!("backtrace: {:?}", backtrace);
        //    }

        ::std::process::exit(1);
    }
}
