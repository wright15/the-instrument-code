// Optional state-machine context projection for Neo4j 5.x.
// This file writes only PhenomenonModel, CourtState, and their typed edges.
// It is idempotent and does not modify ScaleState topology.

CREATE CONSTRAINT phenomenon_model_id IF NOT EXISTS
FOR (p:PhenomenonModel) REQUIRE p.phenomenonId IS UNIQUE;

CREATE CONSTRAINT court_state_id IF NOT EXISTS
FOR (c:CourtState) REQUIRE c.stateId IS UNIQUE;

UNWIND [
  {office: 'Sun', id: 'phenomenon:thermal_radiative_emission',
   name: 'Thermal radiative emission',
   behavior: 'A source generates an outward radiative field.',
   formula: 'Planck spectral radiance',
   assumptions: ['Ideal blackbody for the exact reference expression',
                 'Real materials require emissivity'],
   affordances: ['source', 'radiance', 'outward declaration', 'field generation'],
   prohibitions: ['Representative wavelength is not a blackbody temperature',
                  'Lydian does not physically cause emission'],
   sources: ['https://ies.org/definitions/planck-radiation-law/']},
  {office: 'Moon', id: 'phenomenon:diffuse_reflection',
   name: 'Diffuse reflection and reception',
   behavior: 'Incident irradiance is received and redistributed by a surface.',
   formula: 'L_o = (rho/pi) * E_i',
   assumptions: ['Ideal Lambertian diffuse reference',
                 'Real surfaces may be anisotropic or wavelength dependent'],
   affordances: ['reception', 'mirroring', 'return', 'holding'],
   prohibitions: ['Reflection is not passive in every physical system',
                  'Ionian does not physically cause reflection'],
   sources: ['https://www.earthdata.nasa.gov/s3fs-public/2025-04/AST_05_ATBD.pdf']},
  {office: 'Mars', id: 'phenomenon:combustion_activation_front',
   name: 'Combustion activation front',
   behavior: 'Threshold-crossing reaction and transport can form a propagating front.',
   formula: 'k(T) = A * exp(-E_a/(R*T))',
   assumptions: ['Arrhenius validity range must be declared',
                 'Combustion also depends on transport, mixture, pressure, and geometry'],
   affordances: ['ignition', 'activation threshold', 'force entry', 'propagation'],
   prohibitions: ['Mars does not own physical fire outside this namespace',
                  'Mixolydian does not physically ignite material'],
   sources: ['https://kinetics.nist.gov/kinetics/welcome.jsp']},
  {office: 'Mercury', id: 'phenomenon:photosynthetic_energy_transduction',
   name: 'Photosynthetic energy transduction',
   behavior: 'Captured light is converted through coupled electronic and chemical pathways.',
   formula: 'No single scalar reference formula',
   assumptions: ['Quantitative use must declare organism, pathway, spectrum, and environment'],
   affordances: ['translation', 'mediation', 'coupled conversion', 'adaptive response'],
   prohibitions: ['The correspondence does not derive a biological rate',
                  'Dorian does not physically perform photosynthesis'],
   sources: ['https://pamspublic.science.energy.gov/WebPAMSExternal/Interface/Common/ViewPublicAbstract.aspx?PRoleId=10&rtc=24&rv=e69f20fb-7e68-4dbd-985e-78a36af15a36']},
  {office: 'Jupiter', id: 'phenomenon:rayleigh_scattering',
   name: 'Rayleigh scattering',
   behavior: 'Small scatterers redistribute shorter wavelengths more strongly.',
   formula: 'I_scattered proportional_to lambda^-4',
   assumptions: ['Scatterer size is much smaller than wavelength',
                 'Refractive properties, density, geometry, polarization, and angle matter'],
   affordances: ['redistribution', 'diffusion', 'atmospheric spread', 'branching visibility'],
   prohibitions: ['Not caused by Jupiter, Aeolian, Air, or a mutation',
                  'Framework exclusivity is not exclusivity in physical nature'],
   sources: ['https://ntrs.nasa.gov/citations/20050177903']},
  {office: 'Venus', id: 'phenomenon:selective_molecular_absorption',
   name: 'Selective molecular absorption',
   behavior: 'Composition and path select which incident wavelengths are attenuated.',
   formula: 'A = epsilon * ell * c',
   assumptions: ['Homogeneous sample in an applicable linear range',
                 'Spectral bandwidth, stray light, and scattering are controlled'],
   affordances: ['selection', 'affinity', 'incorporation', 'cohesion'],
   prohibitions: ['Absorption is not identical to molecular bonding',
                  'Phrygian does not physically determine absorbance'],
   sources: ['https://nvlpubs.nist.gov/nistpubs/jres/122/jres.122.033.pdf']},
  {office: 'Saturn', id: 'phenomenon:crystallization_phase_boundary',
   name: 'Crystallization and phase-boundary fixation',
   behavior: 'Ordered growth proceeds after bulk driving force overcomes interfacial cost.',
   formula: 'DeltaG(r) = 4*pi*r^2*gamma + (4/3)*pi*r^3*Delta_g_v',
   assumptions: ['Classical spherical homogeneous nucleation reference',
                 'Real crystallization may be heterogeneous, anisotropic, or nonclassical'],
   affordances: ['boundary', 'constraint', 'critical threshold', 'durable form'],
   prohibitions: ['Every Saturn expression is not a literal crystal',
                  'Locrian does not physically cause a phase transition'],
   sources: ['https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=851489']}
] AS row
MATCH (office:GovernorOffice {name: row.office})
MERGE (model:PhenomenonModel {phenomenonId: row.id})
SET model.displayName = row.name,
    model.physicalBehavior = row.behavior,
    model.referenceFormula = row.formula,
    model.assumptions = row.assumptions,
    model.semanticAffordances = row.affordances,
    model.prohibitedInferences = row.prohibitions,
    model.scientificSources = row.sources,
    model.registryVersion = '0.2.0',
    model.epistemicClass = 'authored_descriptive_model',
    model.assignmentType = 'exclusive_primary_descriptive_model',
    model.exclusivityScope = 'seven_governors_framework',
    model.physicalCausationClaim = false
MERGE (office)-[assignment:PRIMARY_PHENOMENON]->(model)
SET assignment.primary = true,
    assignment.registryVersion = '0.2.0',
    assignment.exclusiveWithinFramework = true;

UNWIND [
  {id: 'C0', index: 0, vector: '0000', kappa: 0.0,
   internal: []},
  {id: 'C1', index: 1, vector: '1000', kappa: 0.25,
   internal: ['Mars']},
  {id: 'C2', index: 2, vector: '1100', kappa: 0.5,
   internal: ['Mars', 'Jupiter']},
  {id: 'C3', index: 3, vector: '1110', kappa: 0.75,
   internal: ['Mars', 'Jupiter', 'Venus']},
  {id: 'C4', index: 4, vector: '1111', kappa: 1.0,
   internal: ['Mars', 'Jupiter', 'Venus', 'Saturn']}
] AS row
MERGE (court:CourtState {stateId: row.id})
SET court.stateIndex = row.index,
    court.vector = row.vector,
    court.kappaCourt = row.kappa,
    court.internalPoles = row.internal,
    court.engineVersion = '0.2.0',
    court.physicalQuantityClaim = false;

UNWIND [
  {from: 'C0', to: 'C1', pole: 'Mars'},
  {from: 'C1', to: 'C2', pole: 'Jupiter'},
  {from: 'C2', to: 'C3', pole: 'Venus'},
  {from: 'C3', to: 'C4', pole: 'Saturn'}
] AS row
MATCH (source:CourtState {stateId: row.from})
MATCH (target:CourtState {stateId: row.to})
MERGE (source)-[transition:COURT_TRANSITION]->(target)
SET transition.action = 'internalize',
    transition.pole = row.pole,
    transition.reversible = true,
    transition.ordinary = true,
    transition.engineVersion = '0.2.0';
