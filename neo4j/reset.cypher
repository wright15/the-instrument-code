// Deliberately destructive: remove only the Seven Governors projection.
MATCH (node)
WHERE node:ScaleState OR node:ScaleFamily OR node:GovernorOffice
DETACH DELETE node;

