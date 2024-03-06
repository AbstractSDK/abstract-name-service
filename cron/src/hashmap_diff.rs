use crate::AbstractInterfaceError;
use std::collections::HashMap;
use std::fmt::Debug;
use std::{collections::HashSet, hash::Hash};

pub fn diff<K, V>(
    scraped_entries: HashMap<K, V>,
    on_chain_entries: HashMap<K, V>,
    remove_outdated: bool,
) -> Result<(HashSet<K>, HashMap<K, V>), AbstractInterfaceError>
where
    K: Eq + Hash + Clone + Debug,
    V: Clone + Debug,
{
    let union_keys = get_union_keys(&scraped_entries, &on_chain_entries);
    Ok(get_changes(
        &union_keys,
        &scraped_entries,
        &on_chain_entries,
        remove_outdated,
    ))
}

fn get_union_keys<'a, K, V>(
    scraped_entries: &'a HashMap<K, V>,
    on_chain_entries: &'a HashMap<K, V>,
) -> Vec<&'a K>
where
    K: Eq + Hash + Clone,
    V: Clone,
{
    let on_chain_binding = on_chain_entries.keys().collect::<HashSet<_>>();
    let scraped_binding = scraped_entries.keys().collect::<HashSet<_>>();

    on_chain_binding.union(&scraped_binding).cloned().collect()
}

fn get_changes<K, V>(
    union_keys: &Vec<&K>,
    scraped_entries: &HashMap<K, V>,
    on_chain_entries: &HashMap<K, V>,
    remove_stale: bool,
) -> (HashSet<K>, HashMap<K, V>)
where
    K: Eq + Hash + Clone + Debug,
    V: Clone + Debug,
{
    let mut to_remove: HashSet<K> = HashSet::new();
    let mut to_add: HashMap<K, V> = HashMap::new();

    for entry in union_keys {
        if !scraped_entries.contains_key(entry) {
            to_remove.insert((*entry).clone());
        } else if !on_chain_entries.contains_key(*entry) {
            let val = scraped_entries.get(*entry).unwrap();
            to_add.insert((*entry).to_owned(), val.clone());
        } else {
            // If the values don't have the same debug representation, we still update
            // This is because it's not possible for vectors to be equal only if their values are equal
            let val_scraped = scraped_entries.get(*entry).unwrap();
            let val_on_chain = on_chain_entries.get(*entry).unwrap();
            if format!("{:?}", val_scraped) != format!("{:?}", val_on_chain) {
                log::info!("{:?} - {:?}", val_scraped, val_on_chain);
                log::info!("entry : {:?}", entry);
                to_add.insert((*entry).to_owned(), val_scraped.clone());
                if remove_stale {
                    to_remove.insert((*entry).clone());
                }
            }
        }
    }
    (to_remove, to_add)
}

#[cfg(test)]
mod test {

    use std::collections::HashMap;
    use std::collections::HashSet;

    use abstract_core::objects::pool_id::UncheckedPoolAddress;
    use abstract_core::objects::AssetEntry;
    use abstract_core::objects::PoolMetadata;
    use abstract_core::objects::PoolType;
    use abstract_core::objects::UniquePoolId;
    use cw_orch::daemon::ChainRegistryData as ChainData;

    use cw_orch::daemon::ChainInfo;
    use cw_orch::prelude::networks::JUNO_1;

    use anyhow::Result as AnyResult;

    use crate::assets::get_scraped_entries;
    use crate::AnsData;
    const CHAIN: ChainInfo = JUNO_1;

    #[test]
    fn assets_not_empty() -> AnyResult<()> {
        let chain: ChainData = CHAIN.into();

        let chain_name = chain.chain_name;
        let chain_id = chain.chain_id.to_string();

        let scraped = get_scraped_entries(&chain_name, &chain_id).unwrap();

        assert!(!scraped.is_empty());
        Ok(())
    }

    #[test]
    fn assets_no_diff() -> AnyResult<()> {
        let chain: ChainData = CHAIN.into();

        let chain_name = chain.chain_name;
        let chain_id = chain.chain_id.to_string();

        let scraped = get_scraped_entries(&chain_name, &chain_id).unwrap();

        let dummy_scraped = scraped.clone();

        let diff = super::diff(scraped, dummy_scraped, false)?;

        assert!(diff.0.is_empty());
        assert!(diff.1.is_empty());
        Ok(())
    }

    #[test]
    fn assets_small_diff() -> AnyResult<()> {
        let chain: ChainData = CHAIN.into();

        let chain_name = chain.chain_name;
        let chain_id = chain.chain_id.to_string();

        let scraped = get_scraped_entries(&chain_name, &chain_id).unwrap();

        let mut dummy_scraped = scraped.clone();
        let first_key = dummy_scraped.keys().next().unwrap().clone();
        let first_value = dummy_scraped.get(&first_key).unwrap().clone();
        dummy_scraped.remove(&first_key);

        let diff = super::diff(scraped, dummy_scraped, false)?;

        assert!(diff.0.is_empty());
        assert_eq!(
            diff.1.into_iter().collect::<Vec<_>>(),
            vec![(first_key, first_value)]
        );
        Ok(())
    }

    #[test]
    fn assets_big_diff() -> AnyResult<()> {
        let chain: ChainData = CHAIN.into();

        let chain_name = chain.chain_name;
        let chain_id = chain.chain_id.to_string();

        let scraped = get_scraped_entries(&chain_name, &chain_id).unwrap();

        let mut dummy_scraped = scraped.clone();

        let n = 6;
        for _i in 0..n {
            let first_key = dummy_scraped.keys().next().unwrap().clone();
            dummy_scraped.remove(&first_key);
        }

        let diff = super::diff(scraped, dummy_scraped, false)?;

        assert!(diff.0.is_empty());
        assert_eq!(diff.1.len(), 6);
        Ok(())
    }

    #[test]
    fn assets_inverse_diff() -> AnyResult<()> {
        let chain: ChainData = CHAIN.into();

        let chain_name = chain.chain_name;
        let chain_id = chain.chain_id.to_string();

        let scraped = get_scraped_entries(&chain_name, &chain_id).unwrap();

        let mut dummy_scraped = scraped.clone();
        let first_key = dummy_scraped.keys().next().unwrap().clone();
        dummy_scraped.remove(&first_key);

        let diff = super::diff(dummy_scraped, scraped, false)?;

        assert!(diff.1.is_empty());
        assert_eq!(diff.0.into_iter().collect::<Vec<_>>(), vec![first_key]);
        Ok(())
    }

    #[test]
    fn assets_both_diff() -> AnyResult<()> {
        let chain: ChainData = CHAIN.into();

        let chain_name = chain.chain_name;
        let chain_id = chain.chain_id.to_string();

        let scraped = get_scraped_entries(&chain_name, &chain_id).unwrap();

        let mut dummy_scraped = scraped.clone();
        let first_key = dummy_scraped.keys().next().unwrap().clone();
        let first_value = dummy_scraped.get(&first_key).unwrap().clone();
        dummy_scraped.remove(&first_key);

        dummy_scraped.insert(
            "dummy_key".to_string(),
            cw_asset::AssetInfoBase::Cw20("dummy_value".to_string()),
        );

        let diff = super::diff(scraped, dummy_scraped, false)?;

        assert_eq!(diff.0.into_iter().collect::<Vec<_>>(), vec!["dummy_key"]);
        assert_eq!(
            diff.1.into_iter().collect::<Vec<_>>(),
            vec![(first_key, first_value)]
        );
        Ok(())
    }

    #[test]
    fn assets_same_key() -> AnyResult<()> {
        let chain: ChainData = CHAIN.into();

        let chain_name = chain.chain_name;
        let chain_id = chain.chain_id.to_string();

        let scraped = get_scraped_entries(&chain_name, &chain_id).unwrap();

        let mut dummy_scraped = scraped.clone();
        let first_key = dummy_scraped.keys().next().unwrap().clone();
        let first_value = dummy_scraped.get(&first_key).unwrap().clone();
        dummy_scraped.remove(&first_key);

        dummy_scraped.insert(
            first_key.to_string(),
            cw_asset::AssetInfoBase::Cw20("dummy_value".to_string()),
        );

        let diff = super::diff(scraped, dummy_scraped, false)?;

        assert!(diff.0.is_empty());
        assert_eq!(
            diff.1.into_iter().collect::<Vec<_>>(),
            vec![(first_key, first_value)]
        );
        Ok(())
    }

    #[test]
    fn assets_same_key_inv() -> AnyResult<()> {
        let chain: ChainData = CHAIN.into();

        let chain_name = chain.chain_name;
        let chain_id = chain.chain_id.to_string();

        let scraped = get_scraped_entries(&chain_name, &chain_id).unwrap();

        let mut dummy_scraped = scraped.clone();
        let first_key = dummy_scraped.keys().next().unwrap().clone();
        dummy_scraped.remove(&first_key);

        let new_value = cw_asset::AssetInfoBase::Cw20("dummy_value".to_string());
        dummy_scraped.insert(first_key.to_string(), new_value.clone());

        let diff = super::diff(dummy_scraped, scraped, false)?;

        assert!(diff.0.is_empty());
        assert_eq!(
            diff.1.into_iter().collect::<Vec<_>>(),
            vec![(first_key, new_value)]
        );
        Ok(())
    }

    #[test]
    fn remove_pool_if_new_pool_address_same() {
        let scraped_entries = HashMap::from([(
            UncheckedPoolAddress::Id(0),
            (PoolMetadata::new(
                "dex_name",
                PoolType::ConstantProduct,
                vec!["asset_a", "asset_b"],
            ),),
        )]);

        let on_chain_entries = HashMap::from([(
            UncheckedPoolAddress::Id(0),
            (PoolMetadata::new(
                "dex_name",
                PoolType::ConstantProduct,
                vec!["asset_a_typo", "asset_b"],
            ),),
        )]);

        let actual_diff = super::diff(scraped_entries, on_chain_entries, true).unwrap();
        let expected_diff = (
            HashSet::from([UncheckedPoolAddress::Id(0)]),
            HashMap::from([(
                UncheckedPoolAddress::Id(0),
                (PoolMetadata::new(
                    "dex_name",
                    PoolType::ConstantProduct,
                    vec!["asset_a", "asset_b"],
                ),),
            )]),
        );
        assert_eq!(actual_diff, expected_diff);
    }

    #[test]
    fn no_diff_in_pool_if_scraped_assets_unsorted() {
        let scraped_entries = AnsData {
            pools: HashMap::from([(
                UncheckedPoolAddress::Id(0),
                (
                    UniquePoolId::new(0),
                    PoolMetadata {
                        dex: "dex_name".to_owned(),
                        pool_type: PoolType::ConstantProduct,
                        assets: vec![AssetEntry::new("asset_b"), AssetEntry::new("asset_a")],
                    },
                ),
            )]),
            ..Default::default()
        };

        let on_chain_entries = AnsData {
            pools: HashMap::from([(
                UncheckedPoolAddress::Id(0),
                (
                    UniquePoolId::new(0),
                    PoolMetadata {
                        dex: "dex_name".to_owned(),
                        pool_type: PoolType::ConstantProduct,
                        assets: vec![AssetEntry::new("asset_a"), AssetEntry::new("asset_b")],
                    },
                ),
            )]),
            ..Default::default()
        };

        let actual_diff = crate::diff(scraped_entries, on_chain_entries).unwrap();
        let expected_diff = crate::AnsDataDiff::default();
        assert_eq!(actual_diff, expected_diff);
    }
}
