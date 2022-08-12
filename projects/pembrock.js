const { BigNumber } = require('bignumber.js');
const {call, addTokenBalances, sumSingleBalance} = require('./helper/near')

const PEMBROCK_CONTRACT = "v1.pembrock.near"
const REF_FINANCE_CONTRACT = "v2.ref-finance.near"
const REF_BOOST_CONTRACT = "boostfarm.ref-labs.near"

function addTokenAmounts(farms, seeds, balances = {}) {
  return Promise.all(Object.values(farms).map(async value => {
    const freeAmount = BigNumber(seeds[`v2.ref-finance.near@${value.ref_pool_id}`].free_amount);
    const lockedAmount = BigNumber(seeds[`v2.ref-finance.near@${value.ref_pool_id}`].lockedAmount);
    const pool = await call(REF_FINANCE_CONTRACT, "get_pool", {"pool_id": value.ref_pool_id});
    let shares = BigNumber(
      await call(REF_FINANCE_CONTRACT, "mft_balance_of", {token_id:  `:${value.ref_pool_id}`, account_id: PEMBROCK_CONTRACT})
    );
    
    shares = shares.plus(freeAmount).plus(lockedAmount);

    const firstTokenAmount = shares.multipliedBy(pool.amounts[0]).dividedBy(pool.shares_total_supply);
    const secondTokenAmount = shares.multipliedBy(pool.amounts[1]).dividedBy(pool.shares_total_supply);

    sumSingleBalance(balances, pool.token_account_ids[0], firstTokenAmount);
    sumSingleBalance(balances, pool.token_account_ids[1], secondTokenAmount);
  }));
}

async function tvl() {
  const [tokens, farms, seeds] = await Promise.all([
    call(PEMBROCK_CONTRACT, "get_tokens", {account_id: PEMBROCK_CONTRACT}),
    call(PEMBROCK_CONTRACT, "get_farms",  {}),
    call(REF_BOOST_CONTRACT, "list_farmer_seeds", {farmer_id: PEMBROCK_CONTRACT})
  ]);

  const balances = {};
  await addTokenAmounts(farms, seeds, balances);  
  await addTokenBalances(Object.keys(tokens), PEMBROCK_CONTRACT, balances);
  return balances;
}

module.exports = {
  near: {
    tvl
  },
}
