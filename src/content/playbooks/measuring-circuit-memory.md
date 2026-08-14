---
title: "Measuring per-circuit memory in Blazor Server"
description: "The soak-test method for putting a real number on your app's per-circuit memory cost, with dotnet-counters and dotnet-gcdump, step by step."
date: 2026-08-14
readingTime: "8 min"
---

Per-circuit memory is the highest-leverage input in any Blazor Server capacity
model, and the one most teams guess. This is the measurement procedure: about half
a day of work the first time, an hour on repeat runs, and it routinely moves sizing
estimates by 2 to 4×.

## What you're measuring

A circuit's memory cost is everything rooted in one user connection: the component
tree's state, scoped DI services, render tree buffers, and anything your components
capture. It is **workload-shaped**. The same framework hosts 0.25 MB circuits and
3 MB circuits depending on how much state your pages hold.

You want two numbers:

1. **Baseline**: the process at steady state with zero circuits (runtime, JIT,
   singletons, caches). This calibrates the *overhead percentage* in your model.
2. **Marginal cost per circuit**: the slope of memory versus circuit count. This is
   the *per-circuit MB* input.

## Setup

- A **production-like node**: same container/VM size, same `Server GC` setting
  (`<ServerGarbageCollection>true</ServerGarbageCollection>`, the default under
  ASP.NET Core on multi-core), same environment configuration.
- Production-scale **data** behind the app. Grids over 50 demo rows measure nothing.
- A load driver that speaks Blazor's SignalR protocol or drives real browsers:
  Playwright-driven browser fleets, k6 with WebSocket scripting, or crank. The
  sessions must follow *realistic paths*: log in, open the screens users actually
  use, and stay connected. An idle circuit on the login page is not representative.
- The diagnostics pair, installed as global tools:

```bash
dotnet tool install -g dotnet-counters
dotnet tool install -g dotnet-gcdump
```

## Procedure

### 1. Capture the baseline

Start the app, warm it (hit the main screens once so JIT and caches settle), let it
idle for ten minutes, then record:

```bash
dotnet-counters monitor -p <pid> \
  System.Runtime[gc-heap-size,working-set,gen-2-gc-count] \
  Microsoft.AspNetCore.Http.Connections[connections-current]
```

Note `gc-heap-size` and `working-set` at idle. Take a heap snapshot too:

```bash
dotnet-gcdump collect -p <pid> -o baseline.gcdump
```

### 2. Load N sessions and let them plateau

Ramp to a meaningful N, a few hundred at minimum, enough that per-circuit cost
dominates noise. **Hold** the sessions connected and lightly active for 15 to 30
minutes. Watch `gc-heap-size` until it plateaus across a few Gen 2 collections.
You're measuring the settled state, not the allocation froth.

```bash
dotnet-gcdump collect -p <pid> -o load-N.gcdump
```

### 3. Double it

Ramp to 2N, plateau again, snapshot again (`load-2N.gcdump`). Two load points let
you compute a slope that cancels out the fixed baseline:

```text
perCircuitMB ≈ (heap@2N − heap@N) ÷ N
```

If the slope between N→2N is much steeper than 0→N implied, you have super-linear
growth, usually a cache keyed per user or an event-handler leak. Stop and
investigate before sizing anything.

### 4. Attribute it

Open the gcdumps in Visual Studio (Debug → Diagnostics) or PerfView and diff
`load-N` against `baseline`. Sort retained size by type. You're looking for:

- Your own component and page-model types. Expected, this *is* circuit state.
- `ComponentState` / `RenderTreeBuilder` frames retaining large object graphs,
  meaning a component is holding full datasets in fields instead of
  paging/virtualizing.
- Event subscriptions from circuits to singletons (`static event`, message buses),
  the classic circuit *leak*: memory that survives disconnect.
- Per-user `IMemoryCache` entries with no size limit or expiration.

### 5. Verify disconnect behaviour

Kill the load driver's connections without graceful disposal and watch heap for the
retention window. Memory should drop after `DisconnectedCircuitRetentionPeriod`
expires. If it doesn't return near baseline, circuits are being retained by
something on your side. Find it now, because in production this presents as "memory
slowly climbs all week and resets on deploy."

## Reading the result

| Measured per-circuit | Interpretation |
|---|---|
| < 0.3 MB | Lean state management. Trust it, re-measure per release. |
| 0.3 to 1.5 MB | Typical enterprise range. Model it and move on. |
| 1.5 to 3 MB | Sizing works but state design deserves a look (virtualization, paging, cache scoping). |
| > 3 MB | Fix the app before buying hardware. Per-node circuit density will hurt operationally (restart herds, GC pauses) regardless of budget. |

Feed the number into the [capacity calculator](/tools/capacity-calculator/) along
with your measured baseline-derived overhead percentage, and date-stamp the result.
Per-circuit cost drifts as features ship, so re-run this measurement each major
release, not once per architecture.
