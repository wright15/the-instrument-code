"""Exact semantic verifier for the GOV-213 max-margin certificate."""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from fractions import Fraction
from typing import Any


# Degree order w1..w7 = Saturn,Jupiter,Mars,Sun,Venus,Mercury,Moon.
WEIGHT_NUMERATORS = (116, 56, 41, 35, 77, 44, 38)
WEIGHT_DENOMINATOR = 407
WEIGHT_STAR = (
    *(Fraction(numerator, WEIGHT_DENOMINATOR) for numerator in WEIGHT_NUMERATORS),
)
EPSILON_STAR = Fraction(3, 407)
LAMBDA_NUMERATORS = (122, 101, 67, 63, 30, 17, 7)
LAMBDA_DENOMINATOR = 407
LAMBDA = (
    *(Fraction(numerator, LAMBDA_DENOMINATOR) for numerator in LAMBDA_NUMERATORS),
)
BINDING_IDS = (
    "w6-w3",
    "w3-w7",
    "w7-w4",
    "Aeolian-Dorian",
    "Phrygian-Aeolian",
    "Locrian-Phrygian",
    "Acoustic-Locrian",
)
A0_ORDER = (
    "Lydian",
    "Ionian",
    "Mixolydian",
    "Dorian",
    "Aeolian",
    "Phrygian",
    "Locrian",
)
_TIERS = ("A0", "A1", "A2")


class CertificateVerificationError(ValueError):
    """Raised when an emitted GOV-213 certificate is not semantically valid."""


@dataclass(frozen=True)
class ConstraintRow:
    """One exact LP inequality of the form ``coefficients dot w >= epsilon``."""

    constraint_id: str
    coefficients: tuple[Fraction, ...]
    group: str


@dataclass(frozen=True)
class CertificateVerification:
    """Exact facts established for an emitted max-margin certificate."""

    constraint_count: int
    tight_set: tuple[str, ...]
    next_tightest_id: str
    next_tightest_value: Fraction
    tight_system_rank: int
    maximum_margin: Fraction
    witness: tuple[Fraction, ...]

    def diagnostic(self) -> dict[str, Any]:
        return {
            "constraintCount": self.constraint_count,
            "epsilonStar": _ratio(self.maximum_margin),
            "tightSet": list(self.tight_set),
            "nextTightestSlack": {
                "pair": self.next_tightest_id,
                **_ratio(self.next_tightest_value),
            },
            "positiveLambda": True,
            "tightSystemRank": self.tight_system_rank,
            "uniqueMaxMargin": True,
        }


@dataclass(frozen=True)
class _Record:
    name: str
    tier: str
    signature: tuple[Fraction, ...]
    projection: Fraction | None


def _form(values: Sequence[int]) -> tuple[Fraction, ...]:
    return tuple(Fraction(value) for value in values)


_CHALDEAN_ROWS = (
    ConstraintRow("w1-w5", _form((1, 0, 0, 0, -1, 0, 0)), "chaldean"),
    ConstraintRow("w5-w2", _form((0, -1, 0, 0, 1, 0, 0)), "chaldean"),
    ConstraintRow("w2-w6", _form((0, 1, 0, 0, 0, -1, 0)), "chaldean"),
    ConstraintRow("w6-w3", _form((0, 0, -1, 0, 0, 1, 0)), "chaldean"),
    ConstraintRow("w3-w7", _form((0, 0, 1, 0, 0, 0, -1)), "chaldean"),
    ConstraintRow("w7-w4", _form((0, 0, 0, -1, 0, 0, 1)), "chaldean"),
    ConstraintRow("w4>=eps", _form((0, 0, 0, 1, 0, 0, 0)), "chaldean"),
)
_BINDING_FORMS = (
    _form((0, 0, -1, 0, 0, 1, 0)),
    _form((0, 0, 1, 0, 0, 0, -1)),
    _form((0, 0, 0, -1, 0, 0, 1)),
    _form((0, 1, 0, 1, 0, -2, 0)),
    _form((0, -2, 0, 0, 1, 0, 1)),
    _form((1, 0, 1, 0, -2, 0, 0)),
    _form((-2, 0, 1, 1, 1, 1, 1)),
)


def _fail(code: str) -> None:
    raise CertificateVerificationError(code)


def _ratio(value: Fraction) -> dict[str, int]:
    return {"numerator": value.numerator, "denominator": value.denominator}


def _expect_mapping(value: object, code: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        _fail(code)
    return value


def _expect_sequence(value: object, code: str) -> Sequence[Any]:
    if not isinstance(value, Sequence) or isinstance(value, (str, bytes)):
        _fail(code)
    return value


def _expect_int(value: object, code: str) -> int:
    if type(value) is not int:
        _fail(code)
    return value


def _read_ratio(value: object, code: str) -> Fraction:
    ratio = _expect_mapping(value, code)
    numerator = _expect_int(ratio.get("numerator"), code)
    denominator = _expect_int(ratio.get("denominator"), code)
    if denominator == 0:
        _fail(code)
    return Fraction(numerator, denominator)


def _read_exact_ratio(value: object, expected: Fraction, code: str) -> Fraction:
    actual = _read_ratio(value, code)
    ratio = _expect_mapping(value, code)
    if (
        actual != expected
        or ratio.get("numerator") != expected.numerator
        or ratio.get("denominator") != expected.denominator
    ):
        _fail(code)
    return actual


def _read_fraction_vector(
    numerators: object,
    denominator: object,
    *,
    expected_length: int,
    code: str,
) -> tuple[Fraction, ...]:
    values = _expect_sequence(numerators, code)
    divisor = _expect_int(denominator, code)
    if len(values) != expected_length or divisor == 0:
        _fail(code)
    return tuple(Fraction(_expect_int(value, code), divisor) for value in values)


def _parse_records(
    records: Iterable[Mapping[str, Any]], *, require_projection: bool
) -> dict[str, tuple[_Record, ...]]:
    if isinstance(records, (str, bytes, Mapping)):
        _fail("certificate_records_must_be_sequence")

    by_tier: dict[str, list[_Record]] = {tier: [] for tier in _TIERS}
    names: set[str] = set()
    for raw_record in records:
        record = _expect_mapping(raw_record, "certificate_record_must_be_object")
        name = record.get("name")
        tier = record.get("tier")
        if not isinstance(name, str) or not name or tier not in _TIERS or name in names:
            _fail("certificate_record_identity_invalid")
        names.add(name)

        signature_values = _expect_sequence(
            record.get("triadicCompressionSignature"),
            "certificate_signature_invalid",
        )
        if len(signature_values) != 7:
            _fail("certificate_signature_invalid")
        signature = tuple(
            Fraction(_expect_int(value, "certificate_signature_invalid"))
            for value in signature_values
        )
        if any(value < 0 or value > 3 for value in signature):
            _fail("certificate_signature_invalid")

        projection = None
        if require_projection:
            projection = _read_ratio(
                record.get("weightedProjection"),
                "certificate_weighted_projection_invalid",
            )
        by_tier[tier].append(_Record(name, tier, signature, projection))

    if any(len(by_tier[tier]) != 7 for tier in _TIERS):
        _fail("certificate_scope_must_have_seven_records_per_tier")

    a0_names = {record.name for record in by_tier["A0"]}
    if a0_names != set(A0_ORDER):
        _fail("certificate_a0_order_domain_mismatch")

    return {
        "A0": tuple(sorted(by_tier["A0"], key=lambda record: A0_ORDER.index(record.name))),
        "A1": tuple(sorted(by_tier["A1"], key=lambda record: record.name)),
        "A2": tuple(sorted(by_tier["A2"], key=lambda record: record.name)),
    }


def _difference_row(
    constraint_id: str,
    upper: _Record,
    lower: _Record,
    group: str,
) -> ConstraintRow:
    return ConstraintRow(
        constraint_id,
        tuple(upper_value - lower_value for upper_value, lower_value in zip(upper.signature, lower.signature, strict=True)),
        group,
    )


def _rows_from_tiers(records: Mapping[str, Sequence[_Record]]) -> tuple[ConstraintRow, ...]:
    rows = list(_CHALDEAN_ROWS)
    a0 = records["A0"]
    for lower, upper in zip(a0, a0[1:], strict=False):
        rows.append(_difference_row(f"{upper.name}-{lower.name}", upper, lower, "a0-order"))
    for upper in records["A1"]:
        for lower in a0:
            rows.append(_difference_row(f"{upper.name}-{lower.name}", upper, lower, "a1-a0"))
    for upper in records["A2"]:
        for lower in records["A1"]:
            rows.append(_difference_row(f"{upper.name}-{lower.name}", upper, lower, "a2-a1"))

    if len(rows) != 111 or len({row.constraint_id for row in rows}) != 111:
        _fail("certificate_constraint_census_mismatch")
    return tuple(rows)


def derive_constraint_rows(records: Iterable[Mapping[str, Any]]) -> tuple[ConstraintRow, ...]:
    """Derive the complete 7 + 6 + 49 + 49 exact-Fraction LP row census."""

    return _rows_from_tiers(_parse_records(records, require_projection=False))


def _dot(form: Sequence[Fraction], weights: Sequence[Fraction]) -> Fraction:
    if len(form) != 7 or len(weights) != 7:
        _fail("certificate_weight_dimension_mismatch")
    return sum((coefficient * weight for coefficient, weight in zip(form, weights, strict=True)), Fraction())


def _coerce_weights(values: Sequence[Fraction], code: str) -> tuple[Fraction, ...]:
    if len(values) != 7:
        _fail(code)
    try:
        return tuple(Fraction(value) for value in values)
    except (TypeError, ValueError, ZeroDivisionError) as error:
        raise CertificateVerificationError(code) from error


def verify_witness_feasible(
    weights: Sequence[Fraction],
    epsilon: Fraction = EPSILON_STAR,
    *,
    records: Iterable[Mapping[str, Any]] | None = None,
) -> list[str]:
    """Return violated row IDs; with records, verify the full 111-row census."""

    witness = _coerce_weights(weights, "certificate_weight_dimension_mismatch")
    rows = _CHALDEAN_ROWS if records is None else derive_constraint_rows(records)
    return [row.constraint_id for row in rows if _dot(row.coefficients, witness) < epsilon]


def verify_dual_identity(
    lambda_vec: Sequence[Fraction] = LAMBDA,
    epsilon: Fraction = EPSILON_STAR,
    *,
    binding_forms: Sequence[Sequence[Fraction]] = _BINDING_FORMS,
) -> bool:
    """Check ``sum(lambda_i * grad(L_i)) = epsilon * 1`` exactly."""

    try:
        lambdas = tuple(Fraction(value) for value in lambda_vec)
        forms = tuple(tuple(Fraction(value) for value in form) for form in binding_forms)
    except (TypeError, ValueError, ZeroDivisionError):
        return False
    if len(lambdas) != 7 or len(forms) != 7 or any(len(form) != 7 for form in forms):
        return False
    summed = tuple(
        sum((lam * form[index] for lam, form in zip(lambdas, forms, strict=True)), Fraction())
        for index in range(7)
    )
    return summed == (epsilon,) * 7


def verify_sum_lambda(lambda_vec: Sequence[Fraction] = LAMBDA) -> bool:
    try:
        values = tuple(Fraction(value) for value in lambda_vec)
    except (TypeError, ValueError, ZeroDivisionError):
        return False
    return len(values) == 7 and sum(values, Fraction()) == Fraction(1)


def _row_reduce(
    matrix: Sequence[Sequence[Fraction]], *, pivot_columns: int
) -> tuple[list[list[Fraction]], int]:
    reduced = [list(row) for row in matrix]
    if any(len(row) < pivot_columns for row in reduced):
        _fail("certificate_matrix_shape_invalid")

    pivot_row = 0
    for column in range(pivot_columns):
        pivot = next(
            (
                row_index
                for row_index in range(pivot_row, len(reduced))
                if reduced[row_index][column] != 0
            ),
            None,
        )
        if pivot is None:
            continue
        reduced[pivot_row], reduced[pivot] = reduced[pivot], reduced[pivot_row]
        divisor = reduced[pivot_row][column]
        reduced[pivot_row] = [value / divisor for value in reduced[pivot_row]]
        for row_index, row in enumerate(reduced):
            if row_index == pivot_row or row[column] == 0:
                continue
            factor = row[column]
            reduced[row_index] = [
                value - factor * pivot_value
                for value, pivot_value in zip(row, reduced[pivot_row], strict=True)
            ]
        pivot_row += 1
        if pivot_row == len(reduced):
            break
    return reduced, pivot_row


def _solve_unique(
    matrix: Sequence[Sequence[Fraction]], rhs: Sequence[Fraction]
) -> tuple[int, tuple[Fraction, ...]]:
    if not matrix or len(matrix) != len(rhs):
        _fail("certificate_matrix_shape_invalid")
    variable_count = len(matrix[0])
    if variable_count == 0 or any(len(row) != variable_count for row in matrix):
        _fail("certificate_matrix_shape_invalid")
    reduced, rank = _row_reduce(
        [list(row) + [value] for row, value in zip(matrix, rhs, strict=True)],
        pivot_columns=variable_count,
    )
    if any(
        all(value == 0 for value in row[:variable_count]) and row[-1] != 0
        for row in reduced
    ):
        _fail("certificate_tight_system_inconsistent")
    if rank != variable_count:
        _fail("certificate_tight_system_rank_mismatch")

    solution = [Fraction() for _ in range(variable_count)]
    for row in reduced:
        pivot = next((index for index, value in enumerate(row[:variable_count]) if value != 0), None)
        if pivot is not None:
            solution[pivot] = row[-1]
    return rank, tuple(solution)


def _solve_tight_system(
    binding_forms: Sequence[Sequence[Fraction]],
) -> tuple[int, tuple[Fraction, ...], Fraction]:
    matrix = [tuple(form) + (Fraction(-1),) for form in binding_forms]
    matrix.append((Fraction(1),) * 7 + (Fraction(),))
    rank, solution = _solve_unique(matrix, (Fraction(),) * 7 + (Fraction(1),))
    return rank, solution[:7], solution[7]


def verify_uniqueness_via_tight_system() -> bool:
    """Solve the eight-variable tight system exactly and verify full rank."""

    try:
        rank, witness, epsilon = _solve_tight_system(_BINDING_FORMS)
    except CertificateVerificationError:
        return False
    return rank == 8 and witness == WEIGHT_STAR and epsilon == EPSILON_STAR


def _read_constraint_ids(value: object, code: str) -> tuple[str, ...]:
    values = _expect_sequence(value, code)
    if not all(isinstance(item, str) for item in values):
        _fail(code)
    return tuple(values)


def verify_certificate_semantics(document: Mapping[str, Any]) -> CertificateVerification:
    """Verify the emitted witness and its complete exact max-margin certificate."""

    if not isinstance(document, Mapping):
        _fail("certificate_document_must_be_object")
    certificate = _expect_mapping(document.get("certificate"), "certificate_missing")
    epsilon = _read_exact_ratio(
        certificate.get("epsilonStar"),
        EPSILON_STAR,
        "certificate_epsilon_mismatch",
    )
    witness_fields = _expect_mapping(certificate.get("witness"), "certificate_witness_missing")
    witness = _read_fraction_vector(
        witness_fields.get("weightNumerators"),
        witness_fields.get("weightDenominator"),
        expected_length=7,
        code="certificate_witness_invalid",
    )
    if witness != WEIGHT_STAR or sum(witness, Fraction()) != Fraction(1) or any(value <= 0 for value in witness):
        _fail("certificate_witness_mismatch")

    method = _expect_mapping(document.get("method"), "certificate_method_missing")
    method_witness = _read_fraction_vector(
        method.get("weightNumerators"),
        method.get("weightDenominator"),
        expected_length=7,
        code="certificate_method_witness_invalid",
    )
    if method_witness != witness:
        _fail("certificate_method_witness_mismatch")
    # Feasibility alone is intentionally not claimed unique; only the LP optimum is.
    if method.get("uniquenessClaim") is not False:
        _fail("certificate_feasible_witness_distinction_failed")
    if certificate.get("optimalityClaim") != "unique_max_margin":
        _fail("certificate_optimality_claim_mismatch")

    tier_records = _parse_records(document.get("records", ()), require_projection=True)
    for records in tier_records.values():
        for record in records:
            if record.projection != _dot(record.signature, witness):
                _fail(f"certificate_weighted_projection_mismatch:{record.name}")
    rows = _rows_from_tiers(tier_records)
    row_by_id = {row.constraint_id: row for row in rows}
    values_by_id = {
        row.constraint_id: _dot(row.coefficients, witness)
        for row in rows
    }
    violated = tuple(
        row.constraint_id for row in rows if values_by_id[row.constraint_id] < epsilon
    )
    if violated:
        _fail(f"certificate_witness_infeasible:{','.join(violated)}")

    actual_tight_set = tuple(
        row.constraint_id for row in rows if values_by_id[row.constraint_id] == epsilon
    )
    certificate_tight_set = _read_constraint_ids(
        certificate.get("tightSet"), "certificate_tight_set_mismatch"
    )
    binding_constraints = _read_constraint_ids(
        certificate.get("bindingConstraints"), "certificate_binding_constraints_mismatch"
    )
    dual = _expect_mapping(certificate.get("dualCertificate"), "certificate_dual_missing")
    dual_binding_constraints = _read_constraint_ids(
        dual.get("bindingConstraints"), "certificate_dual_binding_constraints_mismatch"
    )
    if (
        actual_tight_set != BINDING_IDS
        or certificate_tight_set != actual_tight_set
        or binding_constraints != actual_tight_set
        or dual_binding_constraints != actual_tight_set
    ):
        _fail("certificate_tight_set_mismatch")

    non_tight = tuple(
        (row.constraint_id, values_by_id[row.constraint_id])
        for row in rows
        if row.constraint_id not in actual_tight_set
    )
    next_value = min(value for _, value in non_tight)
    next_ids = tuple(constraint_id for constraint_id, value in non_tight if value == next_value)
    next_tightest = _expect_mapping(
        certificate.get("nextTightestSlack"), "certificate_next_tightest_mismatch"
    )
    if (
        next_ids != ("Acoustic-Phrygian",)
        or next_value != Fraction(6, 407)
        or next_tightest.get("pair") != next_ids[0]
    ):
        _fail("certificate_next_tightest_mismatch")
    _read_exact_ratio(
        next_tightest,
        next_value,
        "certificate_next_tightest_mismatch",
    )

    lambda_values = _read_fraction_vector(
        dual.get("lambdaNumerators"),
        dual.get("lambdaDenominator"),
        expected_length=7,
        code="certificate_lambda_invalid",
    )
    if any(value <= 0 for value in lambda_values):
        _fail("certificate_lambda_not_positive")
    sum_lambda = _read_ratio(dual.get("sumLambda"), "certificate_lambda_sum_mismatch")
    if (
        sum_lambda != Fraction(1)
        or dual.get("sumLambda") != {"numerator": 407, "denominator": 407}
        or sum(lambda_values, Fraction()) != sum_lambda
        or not verify_sum_lambda(lambda_values)
    ):
        _fail("certificate_lambda_sum_mismatch")
    binding_forms = tuple(row_by_id[constraint_id].coefficients for constraint_id in actual_tight_set)
    if not verify_dual_identity(lambda_values, epsilon, binding_forms=binding_forms):
        _fail("certificate_dual_identity_failed")
    if lambda_values != LAMBDA:
        _fail("certificate_lambda_mismatch")

    rank, solved_witness, solved_epsilon = _solve_tight_system(binding_forms)
    if rank != 8:
        _fail("certificate_tight_system_rank_mismatch")
    if solved_witness != witness or solved_epsilon != epsilon:
        _fail("certificate_unique_solution_mismatch")

    return CertificateVerification(
        constraint_count=len(rows),
        tight_set=actual_tight_set,
        next_tightest_id=next_ids[0],
        next_tightest_value=next_value,
        tight_system_rank=rank,
        maximum_margin=epsilon,
        witness=witness,
    )


def full_certificate() -> dict[str, Any]:
    """Return the deterministic certificate fields emitted by the GOV-213 builder."""

    return {
        "epsilonStar": _ratio(EPSILON_STAR),
        "witness": {
            "weightNumerators": list(WEIGHT_NUMERATORS),
            "weightDenominator": WEIGHT_DENOMINATOR,
        },
        "dualCertificate": {
            "lambdaNumerators": list(LAMBDA_NUMERATORS),
            "lambdaDenominator": LAMBDA_DENOMINATOR,
            "sumLambda": {"numerator": 407, "denominator": 407},
            "bindingConstraints": list(BINDING_IDS),
        },
        "bindingConstraints": list(BINDING_IDS),
        "tightSet": list(BINDING_IDS),
        "nextTightestSlack": {
            "numerator": 6,
            "denominator": 407,
            "pair": "Acoustic-Phrygian",
        },
        "optimalityClaim": "unique_max_margin",
        "verifier": "src/governor/certificate_verifier.py",
    }
