// The simulated inbox's only input (OG-EVT-002). Every file in fixtures/events is imported here
// explicitly — a bundler cannot expand a glob, and an explicit list is auditable. The test
// `tests/events.test.ts` reads the directory and fails if a file is added but not imported here,
// so "the inbox renders fixtures/events/*.json" stays true rather than merely intended.
import e001 from '../fixtures/events/001-observation-stale-control-plane.json' with {type:'json'};
import e002 from '../fixtures/events/002-observation-changed-branch.json' with {type:'json'};
import e003 from '../fixtures/events/003-drift-detected-dayos.json' with {type:'json'};
import e004 from '../fixtures/events/004-drift-detected-artemis-omni.json' with {type:'json'};
import e005 from '../fixtures/events/005-connection-state-changed-github.json' with {type:'json'};
import e006 from '../fixtures/events/006-connection-state-changed-vercel.json' with {type:'json'};
import e007 from '../fixtures/events/007-observation-stale-duplicate-delivery.json' with {type:'json'};
import e008 from '../fixtures/events/008-observation-changed-workbench.json' with {type:'json'};
export const fixtureFiles=[
 '001-observation-stale-control-plane.json','002-observation-changed-branch.json',
 '003-drift-detected-dayos.json','004-drift-detected-artemis-omni.json',
 '005-connection-state-changed-github.json','006-connection-state-changed-vercel.json',
 '007-observation-stale-duplicate-delivery.json','008-observation-changed-workbench.json',
] as const;
export const rawFixtureEvents:unknown[]=[e001,e002,e003,e004,e005,e006,e007,e008];
