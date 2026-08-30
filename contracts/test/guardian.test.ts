import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  deployContract,
  submitCallTx,
  type DeployedContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  type EnvironmentConfiguration,
} from '@midnight-ntwrk/testkit-js';
import pino from 'pino';

import { getConfig } from '../config.js';
import {
  MidnightWalletProvider,
  syncWallet,
  type WalletSecret,
} from '../wallet.js';
import { buildProviders, type HelloWorldProviders } from '../providers.js';
import {
  CompiledGuardianContract,
  Contract,
  ledger,
  guardianZkConfigPath,
  type GuardianPrivateState,
} from '../../contracts/guardian-index.js';

// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

const ALICE_LOCAL_SEED =
  '0000000000000000000000000000000000000000000000000000000000000001';

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

const TRAVEL = 0;
let counter = 0;

describe('Guardian Contract (local)', () => {
  let wallet: MidnightWalletProvider;
  let providers: HelloWorldProviders;

  async function queryLedger(address: ContractAddress) {
    const state = await providers.publicDataProvider.queryContractState(address);
    expect(state).not.toBeNull();
    return ledger(state!.data);
  }

  async function deployWithReputation(reputationScore: bigint) {
    counter += 1;
    const privateStateId = `GuardianPrivateState-${reputationScore}-${counter}`;
    const initialPrivateState: GuardianPrivateState = { reputationScore };
    const deployed: DeployedContract<Contract<GuardianPrivateState>> =
      await (deployContract<Contract<GuardianPrivateState>>)(providers, {
        compiledContract: CompiledGuardianContract,
        privateStateId,
        initialPrivateState,
      });
    return { address: deployed.deployTxData.public.contractAddress, privateStateId };
  }

  beforeAll(async () => {
    const config = getConfig();
    setNetworkId(config.networkId);

    const envConfig: EnvironmentConfiguration = {
      walletNetworkId: config.networkId,
      networkId: config.networkId,
      indexer: config.indexer,
      indexerWS: config.indexerWS,
      node: config.node,
      nodeWS: config.nodeWS,
      faucet: config.faucet,
      proofServer: config.proofServer,
    };

    const secret: WalletSecret = { kind: 'seed', value: ALICE_LOCAL_SEED };
    wallet = await MidnightWalletProvider.build(logger, envConfig, secret);
    await wallet.start();
    await syncWallet(logger, wallet.wallet, 10 * 60_000);

    providers = buildProviders(wallet, guardianZkConfigPath, config);
    logger.info('Guardian providers ready. Starting tests!');
  });

  afterAll(async () => {
    if (wallet) {
      await wallet.stop();
    }
  });

  it('approves a small travel spend for a user with enough reputation', async () => {
    const { address, privateStateId } = await deployWithReputation(65n);

    await (submitCallTx<Contract<GuardianPrivateState>, 'checkGuardrails'>)(providers, {
      compiledContract: CompiledGuardianContract,
      contractAddress: address,
      privateStateId,
      circuitId: 'checkGuardrails',
      args: [TRAVEL, 80n, 1n],
    });

    const state = await queryLedger(address);
    expect(state.lastApproved).toEqual(true);
    expect(state.lastAmount).toEqual(80n);
    expect(state.lastTier).toEqual(1n);
  });

  it('blocks a large tier-3 spend when reputation is below the tier-3 threshold', async () => {
    const { address, privateStateId } = await deployWithReputation(65n);

    await (submitCallTx<Contract<GuardianPrivateState>, 'checkGuardrails'>)(providers, {
      compiledContract: CompiledGuardianContract,
      contractAddress: address,
      privateStateId,
      circuitId: 'checkGuardrails',
      args: [TRAVEL, 1500n, 3n],
    });

    const state = await queryLedger(address);
    expect(state.lastApproved).toEqual(false);
  });

  it('approves a large tier-3 spend for a high-reputation user', async () => {
    const { address, privateStateId } = await deployWithReputation(250n);

    await (submitCallTx<Contract<GuardianPrivateState>, 'checkGuardrails'>)(providers, {
      compiledContract: CompiledGuardianContract,
      contractAddress: address,
      privateStateId,
      circuitId: 'checkGuardrails',
      args: [TRAVEL, 1500n, 3n],
    });

    const state = await queryLedger(address);
    expect(state.lastApproved).toEqual(true);
  });
});
