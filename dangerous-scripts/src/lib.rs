use cw_orch::daemon::{ChainInfo, ChainKind};
use cw_orch::daemon::networks::neutron::NEUTRON_NETWORK;

/// <https://github.com/cosmos/chain-registry/blob/master/testnets/neutrontestnet/chain.json>
pub const PION_1: ChainInfo = ChainInfo {
    kind: ChainKind::Testnet,
    chain_id: "pion-1",
    gas_denom: "untrn",
    gas_price: 0.25,
    grpc_urls: &["http://grpc-palvus.pion-1.ntrn.tech:80"],
    network_info: NEUTRON_NETWORK,
    lcd_url: Some("https://rest-palvus.pion-1.ntrn.tech"),
    fcd_url: None,
};
