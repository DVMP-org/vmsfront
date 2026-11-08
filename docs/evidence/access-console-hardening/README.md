# Access console hardening evidence

The local `lvh.me` frontend ran against the canonical checkpoint and
access-control contracts with a real account and gate. Passage and command
responses were isolated fixtures so the decision-to-physical-state UI could be
verified without operating hardware.

Confirmed:

- an allowed passage creates a separate hardware command;
- acknowledgement and observed physical state remain independent;
- a closed barrier is never shown as open from the policy decision;
- an offline browser queues a provisional passage locally;
- the queue explicitly says the person is not checked in until reconnect and
  server verification;
- the console remains readable at tablet and 390px widths.

Evidence:

- `tablet-passage.png`
- `tablet-hardware-states.png`
- `tablet-offline-queue.png`
- `390px-offline-queue.png`
