# Project Plan — Guardian

## Friday night (after opening ceremony)
- [ ] Attend opening ceremony + first workshop, take notes in SETUP.md
- [ ] Get Compact toolchain installed, run the "hello world" example
- [ ] Confirm this repo runs: backend health check + frontend loads
- [ ] Set ANTHROPIC_API_KEY locally, test /agent/task with mocked proof.js (already works out of the box)

## Saturday (the big day)
- [ ] Translate contracts/guardian.compact from pseudocode into real, compiling Compact
- [ ] Get a local proof generated + verified for a simple case (amount under limit, reputation above threshold)
- [ ] Get a local proof that correctly FAILS for a blocked case
- [ ] Swap backend/src/proof.js's evaluateInJs() for a real call into the compiled circuit
- [ ] Polish agent.js prompt so parsing is reliable across a handful of test tasks
- [ ] Sanity check the whole loop: type task -> agent parses -> real proof check -> verdict shown

## Sunday morning (finish line)
- [ ] Polish frontend a little (not too much — function over form)
- [ ] Prepare 3-4 demo tasks: one clearly approved, one blocked by spending limit,
      one blocked by reputation, one edge case
- [ ] Record 2-3 min demo video: problem -> how Midnight is used -> live demo -> wrap up
- [ ] Write Devpost submission (what it does, how it's built, challenges, what's next)
- [ ] Final commit + push before 6:45 PM Egypt time deadline
- [ ] Submit on Devpost

## Fallback plan if the real Compact proof isn't working in time
The mocked proof.js already demonstrates the full concept end-to-end (agent ->
guardrail -> verdict), so worst case, the demo still works and you explain in
the write-up + video exactly how the real proof would slot in (which is
already documented in the TODO comment in proof.js). A working demo of the
*idea* with a clear, honest explanation of what's mocked beats a broken
"real" version.
