"""Dependency-free exact rational linear programming for bounded audits."""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from typing import Iterable, Sequence


class ExactLPError(ValueError):
    """Raised when an exact LP model is malformed."""


@dataclass(frozen=True, slots=True)
class ExactLPResult:
    status: str
    objective: Fraction | None
    variables: tuple[Fraction, ...] | None
    iterations: int


def _fraction(value: int | Fraction) -> Fraction:
    if isinstance(value, bool) or not isinstance(value, (int, Fraction)):
        raise ExactLPError("lp_coefficients_must_be_exact_rationals")
    return Fraction(value)


class _IterationLimit(RuntimeError):
    pass


class _Simplex:
    """Two-phase simplex for max c*x subject to A*x <= b and x >= 0."""

    def __init__(
        self,
        coefficients: Sequence[Sequence[Fraction]],
        bounds: Sequence[Fraction],
        objective: Sequence[Fraction],
        *,
        max_iterations: int,
    ) -> None:
        self.m = len(bounds)
        self.n = len(objective)
        self.basic = [self.n + index for index in range(self.m)]
        self.nonbasic = [*range(self.n), -1]
        self.tableau = [
            [Fraction(0) for _ in range(self.n + 2)] for _ in range(self.m + 2)
        ]
        for row in range(self.m):
            for column in range(self.n):
                self.tableau[row][column] = coefficients[row][column]
            self.tableau[row][self.n] = Fraction(-1)
            self.tableau[row][self.n + 1] = bounds[row]
        for column in range(self.n):
            self.tableau[self.m][column] = -objective[column]
        self.tableau[self.m + 1][self.n] = Fraction(1)
        self.max_iterations = max_iterations
        self.iterations = 0

    def _pivot(self, row: int, column: int) -> None:
        self.iterations += 1
        if self.iterations > self.max_iterations:
            raise _IterationLimit
        pivot = self.tableau[row][column]
        inverse = Fraction(1, 1) / pivot
        for other_row in range(self.m + 2):
            if other_row == row:
                continue
            for other_column in range(self.n + 2):
                if other_column == column:
                    continue
                self.tableau[other_row][other_column] -= (
                    self.tableau[row][other_column]
                    * self.tableau[other_row][column]
                    * inverse
                )
        for other_column in range(self.n + 2):
            if other_column != column:
                self.tableau[row][other_column] *= inverse
        for other_row in range(self.m + 2):
            if other_row != row:
                self.tableau[other_row][column] *= -inverse
        self.tableau[row][column] = inverse
        self.basic[row], self.nonbasic[column] = (
            self.nonbasic[column],
            self.basic[row],
        )

    def _simplex(self, phase: int) -> bool:
        objective_row = self.m + 1 if phase == 1 else self.m
        while True:
            entering = [
                column
                for column in range(self.n + 1)
                if not (phase == 2 and self.nonbasic[column] == -1)
                and self.tableau[objective_row][column] < 0
            ]
            if not entering:
                return True
            column = min(entering, key=lambda item: self.nonbasic[item])
            leaving = [
                row
                for row in range(self.m)
                if self.tableau[row][column] > 0
            ]
            if not leaving:
                return False
            row = min(
                leaving,
                key=lambda item: (
                    self.tableau[item][self.n + 1]
                    / self.tableau[item][column],
                    self.basic[item],
                ),
            )
            self._pivot(row, column)

    def solve(self) -> ExactLPResult:
        try:
            row = min(
                range(self.m),
                key=lambda item: (self.tableau[item][self.n + 1], self.basic[item]),
            )
            if self.tableau[row][self.n + 1] < 0:
                self._pivot(row, self.n)
                if not self._simplex(1) or self.tableau[self.m + 1][self.n + 1] < 0:
                    return ExactLPResult("INFEASIBLE", None, None, self.iterations)
                if self.tableau[self.m + 1][self.n + 1] != 0:
                    return ExactLPResult("INFEASIBLE", None, None, self.iterations)
                artificial_rows = [
                    item for item in range(self.m) if self.basic[item] == -1
                ]
                for artificial_row in artificial_rows:
                    candidates = [
                        column
                        for column in range(self.n + 1)
                        if self.nonbasic[column] != -1
                        and self.tableau[artificial_row][column] != 0
                    ]
                    if candidates:
                        self._pivot(
                            artificial_row,
                            min(candidates, key=lambda item: self.nonbasic[item]),
                        )
            if not self._simplex(2):
                return ExactLPResult("UNBOUNDED", None, None, self.iterations)
            values = [Fraction(0) for _ in range(self.n)]
            for row in range(self.m):
                if 0 <= self.basic[row] < self.n:
                    values[self.basic[row]] = self.tableau[row][self.n + 1]
            return ExactLPResult(
                "OPTIMAL",
                self.tableau[self.m][self.n + 1],
                tuple(values),
                self.iterations,
            )
        except _IterationLimit:
            return ExactLPResult("LIMIT", None, None, self.iterations)


def solve_exact_lp(
    coefficients: Iterable[Iterable[int | Fraction]],
    bounds: Iterable[int | Fraction],
    objective: Iterable[int | Fraction],
    *,
    max_iterations: int = 100_000,
) -> ExactLPResult:
    """Solve an exact max LP in inequality form with deterministic pivoting."""

    matrix = tuple(tuple(_fraction(value) for value in row) for row in coefficients)
    rhs = tuple(_fraction(value) for value in bounds)
    target = tuple(_fraction(value) for value in objective)
    if not target:
        raise ExactLPError("lp_must_have_variables")
    if not matrix or len(matrix) != len(rhs):
        raise ExactLPError("lp_constraint_shape_mismatch")
    if any(len(row) != len(target) for row in matrix):
        raise ExactLPError("lp_row_width_mismatch")
    if type(max_iterations) is not int or max_iterations <= 0:
        raise ExactLPError("lp_max_iterations_must_be_positive_integer")
    return _Simplex(matrix, rhs, target, max_iterations=max_iterations).solve()
