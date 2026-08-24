"""Read-only Harmonic Orrery API backed by the canonical Neo4j projection."""

from __future__ import annotations

import json
import logging
import os
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Request
from neo4j import AsyncDriver, AsyncGraphDatabase
from neo4j.exceptions import Neo4jError
from pydantic import BaseModel, ConfigDict, Field

PROJECT_ROOT = Path(__file__).resolve().parent
for source_root in (PROJECT_ROOT / "src", PROJECT_ROOT / "court-mathematics" / "src"):
    source_root_text = str(source_root)
    if source_root_text not in sys.path:
        sys.path.insert(0, source_root_text)

from governor.harmonic_compression import verify_harmonic_compression_candidate


LOGGER = logging.getLogger(__name__)
HARMONIC_SIDECAR_PATH = (
    PROJECT_ROOT / "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"
)

Governor = Literal["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
AnchorTier = Literal["A0", "A1", "A2"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ExactRatio(StrictModel):
    numerator: int
    denominator: Literal[407]


class StateSummary(StrictModel):
    stateId: int = Field(ge=0, le=4095)
    nodeId: str = Field(pattern=r"^scale:")
    name: str
    forteFamily: Literal["7-35", "7-34", "7-33"]
    tier: AnchorTier
    role: Literal["anchor"]


class ResolutionSummary(StrictModel):
    office: Governor
    officeBearing: Literal[True]


class PhotonicSummary(StrictModel):
    photonicId: str
    office: Governor
    representativeWavelengthNm: float
    photonicCompression: float


class DomainReferences(StrictModel):
    landforms: list[str] = Field(min_length=1)


class CanonicalProfileSummary(StrictModel):
    profileId: str
    profileVersion: str
    office: Governor
    domainReferences: DomainReferences


class ScopedHarmonicDescriptor(StrictModel):
    coordinateId: Literal["harmonic.CH_A012_q_v1"]
    status: Literal["admitted_scoped_A012"]
    stateGovernor: Governor
    weightedProjection: ExactRatio


class HarmonicDescriptorRelease(StrictModel):
    candidateId: Literal["CH_A012_q_v1"]
    coordinateId: Literal["harmonic.CH_A012_q_v1"]
    releaseId: Literal["harmonic-compression-candidate:CH_A012_q_v1:1.0.0"]
    status: Literal["admitted_scoped_A012"]
    candidateFingerprint: str = Field(pattern=r"^[a-f0-9]{64}$")


class OrreryNode(StrictModel):
    state: StateSummary
    resolution: ResolutionSummary
    photonic: PhotonicSummary
    canonicalProfile: CanonicalProfileSummary
    scopedHarmonicDescriptor: ScopedHarmonicDescriptor


class NodesResponse(StrictModel):
    schemaVersion: Literal["harmonic-orrery.nodes.v1"]
    profileRegistryReleaseId: str
    harmonicDescriptor: HarmonicDescriptorRelease
    nodeCount: Literal[21]
    nodes: list[OrreryNode] = Field(min_length=21, max_length=21)


@dataclass(frozen=True)
class Settings:
    uri: str
    username: str
    password: str
    database: str

    @classmethod
    def from_environment(cls) -> "Settings":
        required = ("NEO4J_URI", "NEO4J_USERNAME", "NEO4J_PASSWORD")
        missing = [name for name in required if not os.environ.get(name)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

        return cls(
            uri=os.environ["NEO4J_URI"],
            username=os.environ["NEO4J_USERNAME"],
            password=os.environ["NEO4J_PASSWORD"],
            database=os.environ.get("NEO4J_DATABASE", "neo4j"),
        )


@dataclass(frozen=True)
class HarmonicCandidate:
    release_id: str
    candidate_id: str
    coordinate_id: str
    status: str
    fingerprint: str
    records_by_state_id: dict[int, dict[str, Any]]


NODES_QUERY = """
MATCH (state:ScaleState)-[:OCCUPIES_OFFICE]->(office:GovernorOffice)
WHERE state.role = 'anchor'
  AND state.identityCategory = 'A'
  AND state.hasGovernorSeat = true
  AND state.tier IN ['A0', 'A1', 'A2']
MATCH (office)-[:ACTIVE_PROFILE]->(canonicalProfile:CanonicalFeatureProfile)
MATCH (canonicalProfile)-[:PART_OF_RELEASE]->(release:RegistryRelease {active: true})
MATCH (canonicalProfile)-[:HAS_PHOTONIC_RECORD]->(photonic:PhotonicRecord)
OPTIONAL MATCH (canonicalProfile)-[reference:REFERENCES_LANDFORM]->(landform:LandformReference)
WITH state, office, canonicalProfile, photonic, release, reference, landform
ORDER BY state.tierNumber, state.officeIndex, reference.reference_order
WITH state, office, canonicalProfile, photonic, release, collect(landform.name) AS landforms
RETURN
  state.id AS stateId,
  state.nodeId AS nodeId,
  state.name AS name,
  state.forte AS forteFamily,
  state.tier AS tier,
  state.role AS role,
  office.name AS office,
  canonicalProfile.profile_id AS profileId,
  canonicalProfile.profile_version AS profileVersion,
  canonicalProfile.office AS profileOffice,
  photonic.photonic_id AS photonicId,
  photonic.office AS photonicOffice,
  photonic.wavelength_nm AS representativeWavelengthNm,
  photonic.photonic_compression AS photonicCompression,
  release.release_id AS profileRegistryReleaseId,
  landforms
ORDER BY state.tierNumber, state.officeIndex
"""


def load_harmonic_candidate() -> HarmonicCandidate:
    document = json.loads(HARMONIC_SIDECAR_PATH.read_text(encoding="utf-8"))

    # This verifies source bindings, fingerprints, the 21-anchor scope, and the C_H null guard.
    verify_harmonic_compression_candidate(document, root=PROJECT_ROOT)

    if (
        document["candidateId"] != "CH_A012_q_v1"
        or document["coordinateId"] != "harmonic.CH_A012_q_v1"
        or document["status"] != "admitted_scoped_A012"
    ):
        raise RuntimeError("Unexpected harmonic descriptor identity")

    records_by_state_id = {record["stateId"]: record for record in document["records"]}
    if len(records_by_state_id) != 21:
        raise RuntimeError("Harmonic sidecar must contain exactly 21 unique A0-A2 anchors")

    return HarmonicCandidate(
        release_id=document["releaseId"],
        candidate_id=document["candidateId"],
        coordinate_id=document["coordinateId"],
        status=document["status"],
        fingerprint=document["candidateFingerprint"],
        records_by_state_id=records_by_state_id,
    )


async def read_nodes(transaction: Any) -> list[dict[str, Any]]:
    result = await transaction.run(NODES_QUERY)
    return await result.data()


def build_nodes_response(
    rows: list[dict[str, Any]],
    candidate: HarmonicCandidate,
) -> NodesResponse:
    returned_ids = {int(row["stateId"]) for row in rows}
    expected_ids = set(candidate.records_by_state_id)
    release_ids = {row["profileRegistryReleaseId"] for row in rows}

    if len(rows) != 21 or returned_ids != expected_ids:
        raise HTTPException(
            status_code=503,
            detail="Neo4j A0-A2 anchor projection does not match the verified 21-node scope",
        )

    if len(release_ids) != 1 or None in release_ids:
        raise HTTPException(
            status_code=503,
            detail="Neo4j returned an inconsistent canonical-profile release",
        )

    nodes: list[OrreryNode] = []
    for row in rows:
        state_id = int(row["stateId"])
        descriptor = candidate.records_by_state_id[state_id]
        office = row["office"]

        if (
            descriptor["stateGovernor"] != office
            or descriptor["tier"] != row["tier"]
            or descriptor["forte"] != row["forteFamily"]
            or descriptor["role"] != "anchor"
            or row["role"] != "anchor"
            or row["profileOffice"] != office
            or row["photonicOffice"] != office
        ):
            raise HTTPException(
                status_code=503,
                detail=f"Canonical data mismatch for ScaleState {state_id}",
            )

        nodes.append(
            OrreryNode(
                state=StateSummary(
                    stateId=state_id,
                    nodeId=row["nodeId"],
                    name=row["name"],
                    forteFamily=row["forteFamily"],
                    tier=row["tier"],
                    role="anchor",
                ),
                resolution=ResolutionSummary(office=office, officeBearing=True),
                photonic=PhotonicSummary(
                    photonicId=row["photonicId"],
                    office=office,
                    representativeWavelengthNm=float(row["representativeWavelengthNm"]),
                    photonicCompression=float(row["photonicCompression"]),
                ),
                canonicalProfile=CanonicalProfileSummary(
                    profileId=row["profileId"],
                    profileVersion=row["profileVersion"],
                    office=office,
                    domainReferences=DomainReferences(landforms=list(row["landforms"])),
                ),
                scopedHarmonicDescriptor=ScopedHarmonicDescriptor(
                    coordinateId=candidate.coordinate_id,
                    status=candidate.status,
                    stateGovernor=descriptor["stateGovernor"],
                    weightedProjection=ExactRatio(**descriptor["weightedProjection"]),
                ),
            )
        )

    # Court state is intentionally absent: Mercury is a Governor/engine, not a fifth binary pole.
    return NodesResponse(
        schemaVersion="harmonic-orrery.nodes.v1",
        profileRegistryReleaseId=next(iter(release_ids)),
        harmonicDescriptor=HarmonicDescriptorRelease(
            candidateId=candidate.candidate_id,
            coordinateId=candidate.coordinate_id,
            releaseId=candidate.release_id,
            status=candidate.status,
            candidateFingerprint=candidate.fingerprint,
        ),
        nodeCount=21,
        nodes=nodes,
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = Settings.from_environment()
    candidate = load_harmonic_candidate()
    driver = AsyncGraphDatabase.driver(
        settings.uri,
        auth=(settings.username, settings.password),
    )

    try:
        await driver.verify_connectivity()
        app.state.driver = driver
        app.state.settings = settings
        app.state.harmonic_candidate = candidate
        yield
    finally:
        await driver.close()


app = FastAPI(title="Harmonic Orrery API", version="0.1.0", lifespan=lifespan)


@app.get("/nodes", response_model=NodesResponse)
async def get_nodes(request: Request) -> NodesResponse:
    driver: AsyncDriver = request.app.state.driver
    settings: Settings = request.app.state.settings
    candidate: HarmonicCandidate = request.app.state.harmonic_candidate

    try:
        async with driver.session(database=settings.database) as session:
            rows = await session.execute_read(read_nodes)
    except Neo4jError as error:
        LOGGER.exception("Neo4j /nodes query failed")
        raise HTTPException(status_code=503, detail="Neo4j projection is unavailable") from error

    return build_nodes_response(rows, candidate)
