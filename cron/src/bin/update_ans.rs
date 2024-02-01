use abstract_interface::Abstract;
use cw_orch::{
    deploy::Deploy,
    prelude::{
        *,
        networks::{ChainInfo, parse_network},
    },
};
use cw_orch::daemon::ChainKind;
use cw_orch::daemon::networks::neutron::NEUTRON_NETWORK;
use cw_orch::daemon::networks::PHOENIX_1;
use tokio::runtime::Runtime;

/// <https://github.com/cosmos/chain-registry/blob/master/neutron/chain.json>
pub const NEUTRON_1: ChainInfo = ChainInfo {
    kind: ChainKind::Mainnet,
    chain_id: "neutron-1",
    gas_denom: "untrn",
    gas_price: 0.25,
    grpc_urls: &["http://grpc-kralum.neutron-1.neutron.org:80"],
    network_info: NEUTRON_NETWORK,
    lcd_url: Some("https://rest-kralum.neutron-1.neutron.org"),
    fcd_url: None,
};

fn update_ans() -> anyhow::Result<()> {
    let rt = Runtime::new()?;
    let deployment = Abstract::load_from(Mock::new(&Addr::unchecked("input")))?;
    // Below does not exist anymore?
    // let chain_ids = deployment.get_all_deployed_chains();
    let chain_ids: Vec<String> = vec!["phoenix-1"].into_iter().map(|n| n.to_string()).collect();

    let networks: Vec<ChainInfo> = vec![PHOENIX_1];

    for network in networks {
        let chain = DaemonBuilder::default()
            .handle(rt.handle())
            .chain(network)
            .build()?;

        let deployment = Abstract::load_from(chain)?;

        // Take the assets, contracts, and pools from resources and upload them to the ans host
        let ans_host = deployment.ans_host;
        // First we get all values
        let scraped_entries = script_helpers::get_scraped_entries(&ans_host)?;
        let on_chain_entries = script_helpers::get_on_chain_entries(&ans_host)?;

        // Then we create a diff between the 2 objects
        let diff = script_helpers::diff(scraped_entries, on_chain_entries)?;

        // Finally we upload on-chain
        script_helpers::update(&ans_host, diff)?;
    }
    Ok(())
}

fn main() {
    dotenv().ok();
    env_logger::init();

    use dotenv::dotenv;

    if let Err(ref err) = update_ans() {
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
