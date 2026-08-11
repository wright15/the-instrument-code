# Optional Governor Vault Context

GOV-208 supplies a deterministic, read-only Obsidian vault provider without
changing the closed GOV-207 five-skill API. The provider requires an explicit
absolute path, rejects symlinks and path escape, excludes hidden paths,
`.obsidian`, attachments, binaries, and sensitive notes, and enforces file,
byte, link, traversal, result, and excerpt limits.

No configured provider means no context wrapper: `classify_with_optional_context`
returns the exact existing GOV-203 classifier record and fingerprint. With a
provider, the canonical result is preserved under `baseClassification`; a
separate `contextualRefinement` can cite evidence or abstain but cannot promote
a rule, change office occupancy, or authorize a transition.

## Frontmatter

Notes use strict flat frontmatter. Required fields are `noteId`,
`admissionStatus`, `source`, and `sensitivity`; optional fields include
`title`, `aspectRefs`, `ruleRefs`, `governor`, and `maxTraversalDepth`.
Nested mappings and unknown fields fail closed.

```markdown
---
noteId: example:distribution
title: Distribution example
aspectRefs: ["aspect:distribution:v1"]
ruleRefs: ["rule:distribution:v1"]
governor: Jupiter
admissionStatus: admitted
source: source:operator:vault
sensitivity: public
maxTraversalDepth: 2
---
This note may link to [[example:coupling]].
```

Absolute roots and provider identity never enter bundle identity. The same
allowed vault snapshot copied to another root produces byte-identical output.
Raw private text and live vault artifacts never enter runtime state, Neo4j,
installed skills, QA fixtures, or the release manifest.

Validation: `npm run validate:vault-context`.
