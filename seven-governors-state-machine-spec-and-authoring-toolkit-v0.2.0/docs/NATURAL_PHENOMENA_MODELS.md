# Candidate Natural-Phenomena Models

> **Status: PROPOSED — candidate extension, not admitted.**
> These mappings are not active in the installed integrated release; see the
> admission status below for the exact boundary.

## Admission status

This document and `schemas/physical_phenomena.yaml` describe a candidate
extension. The mappings are not admitted to the active integrated release.
The installed graph has no active `PhenomenonModel` nodes or
`PRIMARY_PHENOMENON` relationships, `/api/creation-packet` emits no phenomenon
section, and runtime health/readiness does not count these models.

The scientific descriptions below retain their cited physical scope. Their
Governor mappings are authored proposals and must not be inferred from graph
proximity, profile vocabulary, or the physical equations.

## What these assignments mean

The candidate proposes one **exclusive primary descriptive model** for each
Governor inside a proposed Seven Governors namespace. If admitted in a future
release, a physical phenomenon could supply behavior, constraints, and
vocabulary for a separately declared semantic projection.

“Exclusive” is namespace-scoped:

- the model has one proposed primary Governor in this candidate version;
- another office cannot claim it as a second primary model without a new
  version and conflict decision;
- secondary analogies must be labeled relational and cannot replace the
  primary assignment; and
- nothing here claims that the phenomenon is exclusive to a planet, scale,
  archetype, or office in physical reality.

`schemas/physical_phenomena.yaml` is the machine-readable candidate paired with
this guide. It is internally validated by this package, but it is not an
authoritative runtime catalog. Installed topology and profile authorities are
listed in `SOURCE_AUTHORITY.md`.

## Candidate registry

| Governor | Proposed primary model | Physical behavior | Framework behavior |
|---|---|---|---|
| Sun | Thermal radiative emission | A source emits a wavelength- and temperature-dependent radiative field | Source, outward expression, coherent actuality |
| Moon | Diffuse reflection / reception | Incident radiance is received and returned according to surface response | Reception, mirroring, memory, inward experience |
| Mars | Combustion activation front | Reaction rate and propagating ignition depend on kinetics and conditions | Force entering, threshold crossing, active propagation |
| Mercury | Photosynthetic energy transduction | Photons are captured and converted through coupled chemical pathways | Translation, mediation, state conversion |
| Jupiter | Rayleigh scattering | Small scatterers redistribute shorter wavelengths more strongly | Distribution, diffusion, expansion into many directions |
| Venus | Selective molecular absorption | Matter selectively attenuates wavelengths according to species and path | Selection, affinity, incorporation, bond |
| Saturn | Crystallization / phase-boundary fixation | A new ordered phase forms under free-energy and interfacial constraints | Boundary, durable form, closure, fixation |

## Sun — thermal radiative emission

**Physical scope:** thermal radiation from matter; an ideal blackbody is a
useful limiting model.

**Reference relation:**

$$
B_\lambda(\lambda,T)
=
\frac{2hc^2}{\lambda^5}
\frac{1}{e^{hc/(\lambda k_BT)}-1}.
$$

**Assumptions:** the exact Planck expression applies to an ideal blackbody in
thermal equilibrium; real materials require emissivity.

**Semantic affordances:** source, radiance, outward declaration, field
generation, visibility.

**Nonclaim:** the Sun office's representative wavelength is not a blackbody
temperature and musical Lydian does not cause emission.

## Moon — diffuse reflection and reception

**Physical scope:** incident radiation is received by a surface and reflected.
For an ideal Lambertian reflector:

$$
L_o=\frac{\rho}{\pi}E_i.
$$

**Assumptions:** diffuse, angle-independent outgoing radiance; real surfaces
may be specular, anisotropic, wavelength-dependent, or participating media.

**Semantic affordances:** receiving, mirroring, returning, holding, contextual
appearance.

**Nonclaim:** reflection is not passive in every physical system and does not
prove the Moon archetype.

## Mars — combustion activation front

**Physical scope:** chemical reaction and ignition fronts depend on reaction
kinetics, transport, mixture, pressure, and geometry. A common temperature
dependence is:

$$
k(T)=A e^{-E_a/(RT)}.
$$

**Assumptions:** the simple Arrhenius form is a model over a declared
temperature range; combustion is a coupled reaction-transport problem, not a
single equation.

**Semantic affordances:** ignition, activation threshold, force entry,
propagation, urgency.

**Nonclaim:** Mars does not own physical fire, nor is every Mars-domain action
combustion.

## Mercury — photosynthetic energy transduction

**Physical scope:** photosynthesis captures light and converts energy through
electronic, chemical, and biochemical pathways into chemical free energy.

**Reference relation:** no single scalar equation is declared as the model.
Domain implementations may track absorbed photons, quantum yield, electron
transport, chemical products, and conversion efficiency with explicit units.

**Assumptions:** organism, pathway, spectrum, intensity, environment, and
timescale must be declared for quantitative use.

**Semantic affordances:** translation between carriers, mediation, coupled
conversion, adaptive response.

**Nonclaim:** the Mercury correspondence does not reduce photosynthesis to a
symbolic metaphor or derive a biological rate.

## Jupiter — Rayleigh scattering

**Physical scope:** elastic scattering in the regime where scatterers are much
smaller than the incident wavelength. Under Rayleigh assumptions, scattering
strength has an inverse fourth-power wavelength dependence:

$$
I_{\mathrm{scattered}}\propto\lambda^{-4}.
$$

**Assumptions:** particle size is small relative to wavelength; refractive
properties, number density, geometry, polarization, and scattering angle
matter. Larger particles require other regimes such as Mie theory.

**Semantic affordances:** redistribution, diffusion, atmospheric spread,
branching visibility, directional expansion.

**Candidate assignment:** `exclusive_primary_descriptive_model` for Jupiter in
the proposed `seven_governors_framework` namespace.

**Nonclaim:** Rayleigh scattering is not caused by Jupiter, Aeolian, Air, or a
mutation operator. The candidate would prevent another office from using it as
a second primary model in this version, but physical Rayleigh scattering
remains wherever its physical conditions hold.

## Venus — selective molecular absorption

**Physical scope:** material composition selectively attenuates incident
radiation. In an appropriate linear regime, Beer–Lambert gives:

$$
A=\varepsilon \ell c
\qquad\text{and}\qquad
A=-\log_{10}(I/I_0).
$$

**Assumptions:** homogeneous sample, applicable concentration range,
appropriate spectral bandwidth, and controlled scattering/stray light.

**Semantic affordances:** selection, affinity, incorporation, value,
cohesion, what enters relation.

**Nonclaim:** absorption and chemical bonding are related only through an
explicit physical domain model; the semantic mapping does not calculate bond
formation.

## Saturn — crystallization and phase-boundary fixation

**Physical scope:** an ordered phase becomes favorable and grows subject to
bulk free-energy and interfacial costs. A classical spherical-nucleus model
uses:

$$
\Delta G(r)=4\pi r^2\gamma
+\frac{4}{3}\pi r^3\Delta g_v.
$$

For a favorable bulk transition, $\Delta g_v<0$; the interfacial term creates
a nucleation barrier.

**Assumptions:** classical nucleation, spherical nucleus, uniform interfacial
energy, and declared thermodynamic conditions. Real crystallization may be
heterogeneous, kinetic, anisotropic, or nonclassical.

**Semantic affordances:** boundary, constraint, critical threshold, durable
form, terminal fixation.

**Nonclaim:** every Saturn expression is a literal crystal or equilibrium
phase transition.

## Scientific sources used by the candidate registry

The physical descriptions are scoped by the following technical references:

- NASA technical record on the inverse-fourth-power behavior of Rayleigh
  scattering:
  <https://ntrs.nasa.gov/citations/20050177903>
- NIST Chemical Kinetics Database parameter convention for modified Arrhenius
  rate expressions:
  <https://kinetics.nist.gov/kinetics/welcome.jsp>
- NIST reference work on Beer–Lambert absorbance:
  <https://nvlpubs.nist.gov/nistpubs/jres/122/jres.122.033.pdf>
- U.S. Department of Energy abstract describing photosynthesis as conversion
  of sunlight into chemical energy:
  <https://pamspublic.science.energy.gov/WebPAMSExternal/Interface/Common/ViewPublicAbstract.aspx?PRoleId=10&rtc=24&rv=e69f20fb-7e68-4dbd-985e-78a36af15a36>
- NASA Lambertian surface treatment:
  <https://www.earthdata.nasa.gov/s3fs-public/2025-04/AST_05_ATBD.pdf>
- NIST work discussing crystallization and interfacial energy:
  <https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=851489>

The sources support the scoped physical summaries, not the Governor
assignments. Those assignments are authored candidates in this package and are
not active framework/profile canon.

## Candidate projection policy

If a future release admits both the mappings and a packet contract, a creation
compiler could transform a phenomenon model into:

- soft descriptive priors;
- process verbs;
- spatial or temporal behaviors;
- material or lighting suggestions;
- required physical constraints when a domain is actually simulating the
  phenomenon; and
- explicit prohibitions against causal overreach.

The proposed default is a soft prior. A physical formula could become a numeric
constraint only when the target domain declares units, variables, assumptions,
and a validation method. The current `landforms` compiler does neither and does
not read this candidate registry.
