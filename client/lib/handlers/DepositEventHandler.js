'use strict';

const Web3 = require('web3');

import config from 'config';
import ethUtil from 'ethereumjs-util';
import web3 from 'lib/web3';
import redis from 'lib/redis';
import { createDepositTransaction } from 'lib/tx';
import { logger } from 'lib/logger';
import txPool from 'lib/txPool';

async function processDepositEvent(event){
  const { depositor, amount, depositBlock, blockNumber } = event.returnValues;
  let depositBlockIndexKey = config.prefixes.tokenIdPrefix + depositBlock;
  console.log('processDepositEvent ---');

  const existingdepositBlockIndex = await redis.getAsync(depositBlockIndexKey);

  if (!existingdepositBlockIndex) 
    await redis.setAsync(depositBlockIndexKey, 1);  

  const tx = await createDepositTransaction(depositor, new Web3.utils.BN(amount), depositBlock);

  let txRlpEncoded = tx.getHash(true).toString('hex');
  const signature = await web3.eth.sign(ethUtil.addHexPrefix(txRlpEncoded), config.plasmaOperatorAddress);

  tx.signature = signature;

  if (tx.validate()) {

    await txPool.addTransaction(tx);
    logger.info(' ', depositBlock);
  }
  else 
    logger.error('Deposit TX error ');
}

export default processDepositEvent;