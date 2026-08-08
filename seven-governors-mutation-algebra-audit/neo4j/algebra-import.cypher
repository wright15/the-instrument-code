// Place operator-registry.csv and operator-applications.csv in Neo4j's import
// directory before running this file.

LOAD CSV WITH HEADERS FROM 'file:///operator-registry.csv' AS row
MERGE (operator:MutationOperator {id: row.operator_id})
SET operator.notation = row.notation,
    operator.name = row.name,
    operator.operatorClass = row.operator_class,
    operator.degree = CASE
      WHEN row.degree = '' THEN null
      ELSE toInteger(row.degree)
    END,
    operator.degreeGovernor = CASE
      WHEN row.degree_governor = '' THEN null
      ELSE row.degree_governor
    END,
    operator.direction = row.direction,
    operator.deltaSemitones = CASE
      WHEN row.delta_semitones = '' THEN null
      ELSE toInteger(row.delta_semitones)
    END,
    operator.domainRule = row.domain_rule,
    operator.action = row.action,
    operator.inverseOperatorId = row.inverse_operator_id,
    operator.conjugateOperatorId = row.conjugate_operator_id,
    operator.partial = toBoolean(row.partial),
    operator.status = row.status,
    operator.applicationCount = toInteger(row.application_count),
    operator.domainSize = toInteger(row.domain_size),
    operator.imageSize = toInteger(row.image_size),
    operator.structuralSupportCount = toInteger(row.structural_support_count),
    operator.fieldSupportCount = toInteger(row.field_support_count);

LOAD CSV WITH HEADERS FROM 'file:///operator-applications.csv' AS row
WITH row
WHERE row.operator_id = 'M'
MATCH (source:ScaleState {id: toInteger(row.source_id)})
MATCH (target:ScaleState {id: toInteger(row.target_id)})
MERGE (source)-[application:MODAL_MUTATES_TO {
  operatorId: row.operator_id
}]->(target)
SET application.applicationId = row.application_id,
    application.operatorClass = row.operator_class,
    application.applicationStatus = row.application_status,
    application.structuralEvidence = toBoolean(row.structural_evidence),
    application.fieldEvidence = toBoolean(row.field_evidence);

LOAD CSV WITH HEADERS FROM 'file:///operator-applications.csv' AS row
WITH row
WHERE row.operator_id <> 'M'
MATCH (source:ScaleState {id: toInteger(row.source_id)})
MATCH (target:ScaleState {id: toInteger(row.target_id)})
MERGE (source)-[application:LOCAL_MUTATES_TO {
  operatorId: row.operator_id
}]->(target)
SET application.applicationId = row.application_id,
    application.operatorClass = row.operator_class,
    application.degree = toInteger(row.degree),
    application.degreeGovernor = row.degree_governor,
    application.direction = row.direction,
    application.deltaSemitones = CASE
      WHEN row.direction = 'raise' THEN 1
      ELSE -1
    END,
    application.applicationStatus = row.application_status,
    application.rawExchangeHamming = 2,
    application.structuralEvidence = toBoolean(row.structural_evidence),
    application.fieldEvidence = toBoolean(row.field_evidence);
