import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';

export {
  Contract,
  ledger,
  type Ledger,
} from './managed/guardian/contract/index.js';
import { Contract } from './managed/guardian/contract/index.js';
import { guardianWitnesses, type GuardianPrivateState } from './guardian-witnesses.js';

const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
export const guardianZkConfigPath = path.resolve(currentDir, 'managed', 'guardian');

export const CompiledGuardianContract = CompiledContract.make<Contract<GuardianPrivateState>>('GuardianContract', Contract).pipe(
  CompiledContract.withWitnesses(guardianWitnesses),
  CompiledContract.withCompiledFileAssets(guardianZkConfigPath),
);

export type { GuardianPrivateState };
