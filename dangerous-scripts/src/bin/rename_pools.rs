use std::sync::Arc;

use abstract_core::ans_host::{
    AssetPairingFilter, ExecuteMsg, PoolAddressListResponse, PoolMetadataListResponse, QueryMsgFns,
};
use abstract_core::ans_host::ExecuteMsgFns;
use abstract_core::objects::pool_id::UncheckedPoolAddress;
use abstract_interface::Abstract;
use cw_orch::contract::Deploy;
use cw_orch::daemon::DaemonBuilder;
use cw_orch::daemon::networks::JUNO_1;
use tokio::runtime::Runtime;

/// Script that takes existing versions in Version control, removes them, and swaps them wit ha new version
pub fn fix_names() -> anyhow::Result<()> {
    let rt = Arc::new(Runtime::new()?);
    let chain = DaemonBuilder::default()
        .handle(rt.handle())
        .chain(JUNO_1)
        .build()?;

    let deployment = Abstract::load_from(chain)?;

    deployment
        .ans_host
        .update_dexes(vec!["wyndex".to_string()], vec![])?;

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
        if metadata.dex == "wynd" {
            pool_ids_to_remove.push(pool_id);
        }
    }

    let mut last_pool_pairing = None;
    let mut all_pool_references = vec![];

    loop {
        let PoolAddressListResponse { pools } = deployment.ans_host.pool_list(
            Some(AssetPairingFilter {
                dex: Some("wynd".to_string()),
                asset_pair: None,
            }),
            None,
            last_pool_pairing,
        )?;
        if pools.is_empty() {
            break;
        }
        all_pool_references.append(
            &mut pools
                .clone()
                .into_iter()
                .flat_map(|(_, refere)| refere)
                .collect(),
        );
        last_pool_pairing = pools.last().map(|(pairing, _)| pairing.to_owned());
    }

    let mut pools_to_add = vec![];

    // pair the unique id in the references to the associated metadata
    for (pool_id, mut metadata) in all_pool_metadatas {
        if let Some(reference) = all_pool_references
            .iter()
            .find(|reference| reference.unique_id == pool_id)
        {
            metadata.dex = "wyndex".to_string();
            pools_to_add.push((
                UncheckedPoolAddress::from(reference.pool_address.clone()),
                metadata,
            ));
        }
    }

    println!("Removing {} pools", pool_ids_to_remove.len());
    println!("Removing pools: {:?}", pool_ids_to_remove);
    println!("Adding {} pools", pools_to_add.len());
    println!("Adding pools: {:?}", pools_to_add);

    // chain.wait_blocks(500).unwrap();

    // add the pools
    deployment
        .ans_host
        .execute_chunked(&pools_to_add, 15, |chunk| ExecuteMsg::UpdatePools {
            to_add: chunk.to_vec(),
            to_remove: vec![],
        })?;

    // remove the pools
    deployment
        .ans_host
        .execute_chunked(&pool_ids_to_remove, 15, |chunk| ExecuteMsg::UpdatePools {
            to_add: vec![],
            to_remove: chunk.to_vec(),
        })?;

    Ok(())
}

fn main() {
    dotenv().ok();
    env_logger::init();

    use dotenv::dotenv;

    if let Err(ref err) = fix_names() {
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
