import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from './managed/guardian/contract/index.js';

export type GuardianPrivateState = {
  reputationScore: bigint;
};

export const guardianWitnesses = {
  reputationScore: (
    context: WitnessContext<Ledger, GuardianPrivateState>,
  ): [GuardianPrivateState, bigint] => {
    return [context.privateState, context.privateState.reputationScore];
  },
};
