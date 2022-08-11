const { BigNumber } = require('bignumber.js');
const {call, addTokenBalances, sumSingleBalance} = require('./helper/near')

function tvl() {
  return async () => {
    const tokens = await call("v1.pembrock.near", "get_tokens", {account_id: "v1.pembrock.near"});
    let balances = await addTokenBalances(Object.keys(tokens), "v1.pembrock.near");
    const farms = await call("v1.pembrock.near", "get_farms",  {});
    const seeds = await call("boostfarm.ref-labs.near", "list_farmer_seeds", {farmer_id: "v1.pembrock.near"});

    await Promise.all(Object.values(farms).map(async value => {
      const pool = await call("v2.ref-finance.near", "get_pool", {"pool_id": value.ref_pool_id})
      const shares1 = BigNumber(await call("v2.ref-finance.near", "mft_balance_of", {token_id: pool.token_account_ids[0], account_id: "v1.pembrock.near"}));
      const shares2 = BigNumber(await call("v2.ref-finance.near", "mft_balance_of", {token_id: pool.token_account_ids[1], account_id: "v1.pembrock.near"}));

      const totalSharesWithFreeAmount = BigNumber(seeds[`v2.ref-finance.near@${value.ref_pool_id}`].free_amount).plus(BigNumber(pool.shares_total_supply));

      const token1_amount = shares1.multipliedBy(BigNumber(pool.amounts[0]).dividedBy(totalSharesWithFreeAmount));
      const token2_amount = shares2.multipliedBy(BigNumber(pool.amounts[1]).dividedBy(totalSharesWithFreeAmount));

      sumSingleBalance(balances, pool.token_account_ids[0], token1_amount);
      sumSingleBalance(balances, pool.token_account_ids[1], token2_amount);
    }))

    return balances;
  }
}

module.exports = {
  near: {
    tvl: tvl()
  },
}
