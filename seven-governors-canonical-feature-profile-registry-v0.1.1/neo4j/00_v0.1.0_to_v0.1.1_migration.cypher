// Optional compatibility migration when v0.1.0 was already imported.
// It preserves all v0.1.0 nodes and only corrects the fixture label.

MATCH (fixture:SemanticFixture)
SET fixture:ValidationFixture
REMOVE fixture:SemanticFixture;

