# aws-schema-reference
Project that keep up-to-date AWS resource schema

## logic

Extracts data from cloud formation markdown docs and generates a json schema for each resource which would be written to a service doc.  

The DDL for `SELECT` statements is then added to the document for a `SELECT` route for each resource in the service.  The end document per service would look like...

```yaml
openapi: 3.0.0
info: {}
externalDocs: {}
servers: []
paths: {}
components:
  schemas:
    ResourceName:
      type: object
      properties:
        PropertyName1:
          $ref: '#/components/schemas/PropertyName1Type'
      ...
    PropertyName1Type:
      type: object
      properties:
        ...
    ResourceNameReturnValues:
      type: object
      properties:
        ...
  x-stackQL-resources:
    s3_bucket_listing:
      name: s3_bucket_listing
      id: aws.pseudo_s3.s3_bucket_listing
      config:
        views:
          select:
            predicate: sqlDialect == "sqlite3"
            ddl: >-
              SELECT  
              JSON_EXTRACT(Properties, '$.Arn') as Arn,
              JSON_EXTRACT(Properties, '$.BucketName') as BucketName,
              JSON_EXTRACT(Properties, '$.DomainName') as DomainName,
              JSON_EXTRACT(Properties, '$.RegionalDomainName') as RegionalDomainName,
              JSON_EXTRACT(Properties, '$.DualStackDomainName') as DualStackDomainName,
              JSON_EXTRACT(Properties, '$.WebsiteURL') as WebsiteURL,
              JSON_EXTRACT(Properties, '$.OwnershipControls.Rules[0].ObjectOwnership') as ObjectOwnership,
              IIF(JSON_EXTRACT(Properties, '$.PublicAccessBlockConfiguration.RestrictPublicBuckets') = 0, 'false', 'true') as RestrictPublicBuckets,
              IIF(JSON_EXTRACT(Properties, '$.PublicAccessBlockConfiguration.BlockPublicPolicy') = 0, 'false', 'true') as BlockPublicPolicy,
              IIF(JSON_EXTRACT(Properties, '$.PublicAccessBlockConfiguration.BlockPublicAcls') = 0, 'false', 'true') as BlockPublicAcls,
              IIF(JSON_EXTRACT(Properties, '$.PublicAccessBlockConfiguration.IgnorePublicAcls') = 0, 'false', 'true') as IgnorePublicAcls,
              JSON_EXTRACT(Properties, '$.Tags') as Tags
              FROM aws.cloud_control.resources
              WHERE region = 'ap-southeast-1' and data__TypeName = 'AWS::S3::Bucket' ;
  security:
    - hmac: []
```
