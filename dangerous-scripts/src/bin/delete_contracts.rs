use abstract_core::ans_host::{ContractListResponse, ExecuteMsg, QueryMsgFns};
use abstract_interface::Abstract;
use clap::Parser;
use cw_orch::daemon::DaemonBuilder;
use cw_orch::daemon::networks::{parse_network, PHOENIX_1};
use cw_orch::deploy::Deploy;
use tokio::runtime::Runtime;

use dangerous_ans_scripts::PION_1;

/// Script that takes existing versions in Version control, removes them, and swaps them wit ha new version
pub fn fix_names(args: Arguments) -> anyhow::Result<()> {
    let rt = Runtime::new()?;
    let chain = DaemonBuilder::default()
        .handle(rt.handle())
        .chain(PION_1)
        // .chain(parse_network(&args.network_id))
        .build()?;

    let deployment = Abstract::load_from(chain)?;

    let mut all_contract_entries = vec![];

    let mut last_contract = None;

    loop {
        let ContractListResponse { mut contracts } =
            deployment
                .ans_host
                .contract_list(None, None, last_contract)?;
        if contracts.is_empty() {
            break;
        }
        all_contract_entries.append(&mut contracts);
        last_contract = all_contract_entries
            .last()
            .map(|(entry, _)| entry.to_owned());
    }

    let mut contracts_to_remove = vec![];

    for (mut entry, addr) in all_contract_entries {
        contracts_to_remove.push(entry.clone().into());
    }
    //
    println!("Removing {} contracts", contracts_to_remove.len());
    println!("Removing contracts: {:?}", contracts_to_remove);

    // chain.wait_blocks(500).unwrap();

    // remove the contracts
    deployment
        .ans_host
        .execute_chunked(&contracts_to_remove, 20, |chunk| {
            ExecuteMsg::UpdateContractAddresses {
                to_add: vec![],
                to_remove: chunk.to_vec(),
            }
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


    if let Err(ref err) = fix_names(args) {
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
