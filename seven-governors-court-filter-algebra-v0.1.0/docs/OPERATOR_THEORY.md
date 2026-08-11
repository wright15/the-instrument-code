# Linear Diagonal Court Filter Theory Sheet

## Definition

For a fixed-root 12-bit mask `c`, the sole admitted type is
`P_c(x) = x AND c`, equivalently `diag(c)` over binary coordinates. Concrete
operators are restricted to C0-C4 and rooted 5-23 and 5-27.

## Contract

| Declaration | Value |
|---|---|
| Domain | Every binary 12-vector, integer masks 0 through 4095 |
| Codomain | Binary 12-vectors |
| Image | All support subsets of `c` |
| Global inverse | None; projection is non-injective |
| Inverse restricted to image | Identity |
| Exact harmonic delta | `weight(source) - weight(source AND c)` |
| Idempotence | `P_c(P_c(x)) = P_c(x)` |
| Retained weight | `popcount(source AND c)` |
| Commutation | Five-valued total evaluator over partial mutation routes |

The evaluator names the left route `P_c(T(x))` and the right route
`T(P_c(x))`. For this release, every filtered operand has weight at most five,
so it is outside the admitted rooted weight-seven mutation domain. A defined
mutation therefore yields `right_undefined`; an undefined source mutation
yields `both_undefined`.

Filters produce observations only. They cannot mutate `ScaleState.office`,
`OCCUPIES_OFFICE`, Degree-Governor metadata, or mutation source/target states.
