const { fetchURL } = require('./helper/utils')
const {call, addTokenBalances, sumSingleBalance} = require('./helper/near')

function tvl(timestamp, block, chainBlocks) {
  return async () => {
    const tokens = await call("v1.pembrock.near", "get_tokens", {account_id: "v1.pembrock.near"});
    let balances = await addTokenBalances(Object.keys(tokens), "v1.pembrock.near");
    const farms = await call("v1.pembrock.near", "get_farms",  {});
    for(let key of Object.keys(farms)) {
      const pool = await call("v2.ref-finance.near", "get_pool", {"pool_id": farms[key].ref_pool_id})
      const shares1 = await call("v2.ref-finance.near", "mft_balance_of", {token_id: pool.token_account_ids[0], account_id: "v1.pembrock.near"});
      const shares2 = await call("v2.ref-finance.near", "mft_balance_of", {token_id: pool.token_account_ids[1], account_id: "v1.pembrock.near"});
      const token1_amount = shares1 * pool.amounts[0] / pool.shares_total_supply;
      const token2_amount = shares2 * pool.amounts[1] / pool.shares_total_supply;
      sumSingleBalance(balances, pool.token_account_ids[0], token1_amount);
      sumSingleBalance(balances, pool.token_account_ids[1], token2_amount);
    }
  
    return balances;
  }
}

module.exports = {
  near: {
    tvl: tvl()
  },
}
