---
title: "Capacity planning for Blazor Server: the full methodology"
description: "How to size app nodes, Azure SignalR units, and message budget for a Blazor Server workload — every formula shown, from measurement to validation."
date: 2026-08-14
readingTime: "12 min"
---

Blazor Server's programming model has a cost model attached: every connected browser
tab holds a **circuit** — live UI state — in your server's memory, and every UI
update rides a SignalR message that, on Azure SignalR Service, is metered. That
means capacity planning isn't optional at enterprise scale. It also means it's
tractable: the whole model fits in a dozen inputs.

This playbook is the methodology behind our
[capacity calculator](/tools/capacity-calculator/). Use the tool for the arithmetic;
use this page to understand — and challenge — every number in it.

## The model at a glance

Work top to bottom: users → circuits → memory → nodes, and users → connections →
SignalR units → message budget.

```text
activeCircuits        = users × tabsPerUser
disconnectedCircuits  = activeCircuits × disconnectedRatio
totalCircuits         = activeCircuits + disconnectedCircuits

circuitMemoryGB       = totalCircuits × perCircuitMB ÷ 1024
totalMemoryGB         = circuitMemoryGB × (1 + overheadPct)

appNodes              = ceil( (totalMemoryGB ÷ usableGBPerNode) ÷ (1 − sparePct) )

signalrUnits          = ceil( (activeCircuits ÷ connectionsPerUnit) × (1 + headroomPct) )

dailyMessages         = users × messagesPerUserPerMin × activeMinutesPerDay
includedMessages      = signalrUnits × includedMessagesPerUnitPerDay
coverage              = includedMessages − dailyMessages
```

Twelve inputs, four outputs. The skill is not in the arithmetic — it's in where the
inputs come from. That's the rest of this playbook.

## Step 1 — Establish real concurrency, not license counts

The number that matters is **peak concurrent users**, and almost every organization
overestimates it by starting from "we have 12,000 users." Licensed users, daily
active users, and concurrent users differ by large multiples.

- Pull concurrent session counts from production telemetry (Application Insights,
  your identity provider, or SignalR connection counters).
- Use the **95th percentile of peak**, not the single worst minute of the year —
  spare capacity (step 4) is what absorbs the true worst case.
- Multiply by **tabs per user**. Enterprise users keep the app open in more than one
  tab more often than you'd expect; 1.2–1.5 is a typical measured range. Each tab is
  a full circuit, not a free rider.

Then add the **disconnected ratio**. When a user's network blips or a node drains
during deployment, Blazor holds the circuit in memory for a reconnect window. Under
network churn or rolling restarts, 5–15% extra circuits in memory is realistic. This
is governed by `DisconnectedCircuitMaxRetained` and the retention period — know your
configured values.

## Step 2 — Measure per-circuit memory (never use a default)

Per-circuit memory is **the highest-leverage input in the whole model** and it is
workload-specific: a dashboard holding grids of data in component state can cost 10×
what a form-based workflow costs. Published figures (the oft-quoted ~250 KB/circuit)
describe minimal apps, not yours.

The short version (the [full measurement playbook](/playbooks/measuring-circuit-memory/)
covers this end to end):

1. Run the app under Server GC on a production-like node.
2. Drive N realistic user sessions (real navigation paths, real data volumes) with a
   load tool that speaks SignalR.
3. Take `dotnet-gcdump` snapshots at stable plateaus of N and 2N sessions.
4. Per-circuit cost ≈ (heap₂ − heap₁) ÷ N, after the app's fixed baseline is
   subtracted.

Enterprise Blazor Server apps commonly land in the **0.3–1.5 MB per circuit** range.
If you measure above ~2 MB, fix state management before buying hardware — that's
almost always cheaper.

## Step 3 — Overhead is a percentage, and it's bigger than you think

Circuit state isn't the only memory on the node: the runtime, JIT'd code, connection
buffers, dependency-injection singletons, caches (`IMemoryCache`, HybridCache),
and GC headroom all sit on top. Model this as a percentage uplift on circuit memory —
**25–50% is a sane starting band**, tuned to your measured baseline from step 2's
idle snapshot.

Two things people forget:

- **Usable memory per node ≠ VM memory.** Reserve the OS, monitoring agents, and
  container overhead first. On a 16 GB node, 12 GB usable for the .NET process is a
  reasonable posture.
- **Server GC wants headroom.** Running a node at 90%+ of memory steady-state means
  GC pressure, latency spikes, and eventually OOM restarts that dump every circuit
  on that node — which then reconnect elsewhere as a thundering herd.

## Step 4 — Spare capacity is a first-class input

The node count that matters is not "enough at peak" but "enough at peak **while one
node is down and a deployment is in flight**." Model it explicitly:

```text
appNodes = ceil( rawNodes ÷ (1 − sparePct) )
```

20–40% spare is typical. At small node counts, use the N+1 sanity check: with 3
nodes, losing one removes 33% of capacity — your spare percentage must cover that,
or a single node failure at peak cascades into circuit loss on the survivors.

## Step 5 — SignalR units: connections first, then messages

Azure SignalR Service is sized in units. Each unit carries two ceilings, and **both**
must clear:

1. **Connections** — `ceil(activeCircuits ÷ connectionsPerUnit)`, then add headroom
   (25% is a sound default) for reconnect storms: a node drain reconnects thousands
   of clients within seconds, and connection ramp during that burst is what breaks
   under-provisioned tiers.
2. **Messages** — every UI interaction round-trips messages, and units include a
   daily allotment. Estimate `users × messagesPerUserPerMinute × activeMinutesPerDay`
   and compare against `units × includedPerUnitPerDay`. Interactive enterprise apps
   typically generate **2–5 messages per user-minute**; chatty real-time dashboards
   far more.

When message demand exceeds the connection-driven unit count's allotment, you either
add units or cut message volume. Cutting is often cheap: batch UI updates, throttle
high-frequency events (`oninput` → debounced), and move heavy push scenarios to
coarser granularity.

## Step 6 — Pick the architecture pattern honestly

The same workload sizes differently under different architectures. Three patterns
cover most enterprise deployments:

| Pattern | Shape | Sizing effect |
|---|---|---|
| **A — Azure managed** | Blazor Server + Azure SignalR Service + SQL + Redis/HybridCache | Baseline. Connection scaling is the service's problem. |
| **B — Self-managed** | App-tier SignalR with Redis backplane, strict LB affinity | Backplane and affinity overhead: expect ~10% more circuit memory and overhead; you now own reconnect storms. |
| **C — Workload split** | Interactive UI on Blazor Server; reports/exports/recalcs in async workers | Circuits get cheaper (~15%) because heavy work leaves the interactive tier — usually the highest-ROI architectural move on this list. |

If your per-circuit measurement is high because circuits are doing batch-shaped work,
pattern C *is* the fix — it moves cost from every-user-always to on-demand workers.

## Step 7 — Validate: the plan is a hypothesis

A capacity plan you haven't soak-tested is a well-formatted guess. Before
procurement or go-live:

- **Soak** at modeled peak for hours, not minutes — circuit memory issues are
  slow-growth phenomena. Watch GC heap, working set, and connection counts
  (`dotnet-counters`) for drift.
- **Fail** a node at peak load and watch the reconnect storm land on the survivors
  and on your SignalR tier. This validates both spare capacity and headroom in one
  test.
- **Deploy** under load. Rolling restarts are the most common real-world trigger of
  the disconnected-circuit spike you modeled in step 1.

Then feed the measured numbers back into the model. Capacity planning for Blazor
Server isn't a one-time spreadsheet — it's a loop: model → test → measure →
remodel. The [calculator](/tools/capacity-calculator/) exists to make the loop fast;
its JSON export lets you keep dated snapshots of the plan as the workload evolves.

## Pitfalls checklist

- Sizing from licensed users instead of measured concurrency
- Trusting a per-circuit default instead of measuring your app
- Forgetting tabs-per-user and disconnected circuits entirely
- Treating VM memory as usable process memory
- Sizing SignalR on connections and discovering the message meter in the first invoice
- No spare capacity model — "it fit at peak" until the first node failure at peak
- Validating with a 10-minute load test and calling it a soak

---

*Every formula above is implemented, with the same names, in the open-source
[calculator core](https://github.com/Vadami-ai/blazor-server-capacity-calculator/blob/main/src/calc-core.js).
Disagree with an assumption? That's what the issues tab is for.*
