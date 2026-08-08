// Optional derived mutation-algebra projection.
// Run after the canonical Seven Governors Neo4j schema/import.

CREATE CONSTRAINT mutation_operator_id IF NOT EXISTS
FOR (operator:MutationOperator)
REQUIRE operator.id IS UNIQUE;

CREATE INDEX mutation_operator_class IF NOT EXISTS
FOR (operator:MutationOperator)
ON (operator.operatorClass);

CREATE INDEX mutation_operator_degree IF NOT EXISTS
FOR (operator:MutationOperator)
ON (operator.degree);

CREATE INDEX local_mutation_operator IF NOT EXISTS
FOR ()-[application:LOCAL_MUTATES_TO]-()
ON (application.operatorId);

CREATE INDEX modal_mutation_operator IF NOT EXISTS
FOR ()-[application:MODAL_MUTATES_TO]-()
ON (application.operatorId);
