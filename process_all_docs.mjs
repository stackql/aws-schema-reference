import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

const outputs_dir = 'outputs';
const docsDir = './aws-cloudformation-user-guide/doc_source';

function getName(inputString) {
  /*
  Gets the name of a property
  */  
  const pattern = /`([^`]+)`.*<a[^>]+name="([^"]+)"/;
  const match = inputString.match(pattern);
  if (match) {
    return match[1];
  } else {
    return false;
  }
}

function getPropertyField(line) {
  const matches = line.match(/^\*([^*]+)\*: *(.*?) *(\[.*?\])?$/);
  if (!matches) {
    return false;
  }
  const fieldName = matches[1].trim().toLowerCase().replace(/\s+/g, '');
  let fieldValue = matches[2].trim() + (matches[3] || '');
  if (fieldName == 'type') {
    fieldValue = fieldValue.toLowerCase();
    if (fieldValue == 'list of string'){
      return { type: 'array', items: { type: 'string' } };
    }
    if (fieldValue == 'json'){
      return { type: 'object' };
    }    
  }
  return { [fieldName]: fieldValue };
}


function extractProperties(properties){
  /*
  Extracts properties into an object
  */
  let result = [];
  for (let i = 0; i < properties.length; i++) {
    let propSet = {};
    let description = '';
    // remove named fields
    for (let j = 0; j < properties[i].length; j++) {
      let thisProp = properties[i][j];

      // name or false
      const name = getName(thisProp);
      if (name) {
        propSet.name = name;
      }

      // property field or false
      let propertyField = getPropertyField(thisProp);
      if (propertyField) {

        if (propertyField.required) {
          if (propertyField.required == 'Yes') {
            propertyField.required = true;
          } else {
            propertyField.required = false;
          }
        }

        Object.assign(propSet, propertyField);
      }

      // description if not name or property field
      if (!name && !propertyField) {
        description += thisProp + ' ';
      }
    }
    propSet.description = description.trim();
    result.push(propSet);
  }
  return result;
}


function getProperties(lines, propertiesIndex){
  /*
  Gets properties from a resource file
  */

  // find the index of the next heading after Properties
  let nextHeadingIndex = lines.length;
  for (let i = propertiesIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      nextHeadingIndex = i;
      break;
    }
  }

  // extract the lines under Properties and before the next heading
  const propertiesLines = lines.slice(propertiesIndex + 1, nextHeadingIndex);
    
  let result = [];
  let currentList = [];
  
  propertiesLines.forEach((line, index) => {
    let trimmedLine = line.trim();
    if (trimmedLine === '') {
      result.push(currentList);
      currentList = [];
    } else {
      currentList.push(line);
    }
  });
  
    // Add last list to result
  if (currentList.length > 0) {
    result.push(currentList);
  }
  return result.filter(list => list.length > 0);
}


function processResource(jsonSchema, resourceFileName, service, awsService, resource, awsResource, fq_resource) {
  /*
  Process resource file get properties and return values from resource file by calling extractProperties() and extractReturnValues()
  */

  // console.log(`Processing ${resourceFileName}...`);
  // console.log(`Service: ${service}`);
  // console.log(`AWS Service: ${awsService}`);
  // console.log(`Resource: ${resource}`);
  // console.log(`AWS Resource: ${awsResource}`);
  // console.log(`FQ Resource: ${fq_resource}`);

  jsonSchema[awsResource] = {};
  jsonSchema[awsResource]['type'] = 'object';
  jsonSchema[awsResource]['properties'] = {};
  jsonSchema[awsResource]['required'] = [];
  
  const markdown = fs.readFileSync(path.join(docsDir, resourceFileName), 'utf-8');

  // read each line in the markdown file
  const lines = markdown.split('\n');

  // find the index of the Properties heading
  const propertiesIndex = lines.findIndex(line => line.startsWith('## Properties'));
  const resProperties = extractProperties(getProperties(lines, propertiesIndex));

  // for each property, add to jsonSchema
  resProperties.forEach(prop => {
    jsonSchema[awsResource]['properties'][prop.name] = {};
    // TODO if type is object, gets its properties
    jsonSchema[awsResource]['properties'][prop.name]['type'] = prop.type;
    jsonSchema[awsResource]['properties'][prop.name]['description'] = prop.description;
    if (prop.required) {
      jsonSchema[awsResource]['required'].push(prop.name);
    }
  });

  if (jsonSchema[awsResource]['required'].length == 0) {
    delete jsonSchema[awsResource]['required'];
  }


  // TODO - extract return values, using extractReturnValues()

  return jsonSchema;

}

function camelToSnakeCase(inputStr) {
    const exceptions = {
      EC2: "ec2",
      ACMPCA: "acmpca",
      AmazonMQ: "amazon_mq",
      AmplifyUIBuilder: "amplify_ui_builder",
      ApiGatewayV2: "api_gateway_v2",
      APS: "aps",
      CE: "ce",
      Cloud9: "cloud9",
      CUR: "cur",
      DAX: "dax",
      DLM: "dlm",
      DMS: "dms",
      DocDB: "doc_db",
      DocDBElastic: "doc_db_elastic",
      DynamoDB: "dynamo_db",
      ECR: "ecr",
      ECS: "ecs",
      EFS: "efs",
      EKS: "eks",
      ElasticLoadBalancingV2: "elastic_load_balancing_v2",
      EMR: "emr",
      EMRContainers: "emr_containers",
      EMRServerless: "emr_serverless",
      FIS: "fis",
      FMS: "fms",
      FSx: "fsx",
      GreengrassV2: "greengrass_v2",
      IAM: "iam",
      InspectorV2: "inspector_v2",
      IoT: "iot",
      IoT1Click: "iot1_click",
      IoTAnalytics: "iot_analytics",
      IoTCoreDeviceAdvisor: "iot_core_device_advisor",
      IoTEvents: "iot_events",
      IoTFleetHub: "iot_fleet_hub",
      IoTFleetWise: "iot_fleet_wise",
      IoTSiteWise: "iot_site_wise",
      IoTTwinMaker: "iot_twin_maker",
      IoTWireless: "iot_wireless",
      IVS: "ivs",
      KinesisAnalyticsV2: "kinesis_analytics_v2",
      KMS: "kms",
      M2: "m2",
      MemoryDB: "memory_db",
      MSK: "msk",
      MWAA: "mwaa",
      OpsWorksCM: "ops_works_cm",
      QLDB: "qldb",
      RAM: "ram",
      ResourceExplorer2: "resource_explorer2",
      RDS: "rds",
      Route53: "route53",
      Route53Resolver: "route53_resolver",
      Route53RecoveryReadiness: "route53_recovery_readiness",
      Route53RecoveryControl: "route53_recovery_control",
      RUM: "rum",
      SDB: "sdb",
      SES: "ses",
      SNS: "sns",
      SQS: "sqs",
      SSM: "ssm",
      S3: "s3",
      S3ObjectLambda: "s3_object_lambda",
      S3Outposts: "s3_outposts",
      SSMContacts: "ssm_contacts",
      SSMIncidents: "ssm_incidents",
      SSO: "sso",
      VoiceID: "voice_id",
      WAF: "waf",
      WAFRegional: "waf_regional",
      WAFv2: "waf_v2",
      XRay: "xray",
    };
  
    if (inputStr in exceptions) {
      return exceptions[inputStr];
    } else {
      let result = "";
      for (let i = 0; i < inputStr.length; i++) {
        const char = inputStr[i];
        if (char.toUpperCase() === char && i > 0) {
          result += "_";
        }
        result += char.toLowerCase();
      }
      return result;
    }
  }

  function process_resources(service, aws_service, file_contents) {
    /*
    Identifies the resources in each service file and passes them to processResource()
    */
    let jsonSchema = {};

    const lines = file_contents.split('\n');
    let resource_section = false;
    for (let line of lines) {
        if (line.startsWith('**Resource types**')) {
            resource_section = true;
        } else if (resource_section && line.startsWith('+')) {
            const parts = line.trim().split(/\s+/);
            const fq_resource = parts[1].split('](')[0].substring(1);
            const aws_resource = parts[1].split('](')[0].trim('[').split('::').slice(-1)[0];
            const resource = camelToSnakeCase(aws_resource);
            const resource_file_name = parts[1].split('](')[1].slice(0, -1);
            jsonSchema = processResource(jsonSchema, resource_file_name, service, aws_service, resource, aws_resource, fq_resource);
        }
    }
    return jsonSchema;
}

function process_services(filename, file_contents) {
    /*
    Processes a single markdown file (service entrypoint file), e.g. the contents of AWS_Lambda.md
    * Derives the service name from the snake case filename, e.g. AWS_Lambda.md -> lambda
    * Creates an output directory for each service, e.g. lambda
    * Passes file conents to process_resources() for each resource in the service
    */
    const aws_service = filename.slice(4, -3);
    const service = camelToSnakeCase(aws_service);
    if (['ec2', 's3', 'iam'].includes(service)) { // excluding services that already exist
        // do nothing
    } else {
        console.log(`processing service: ${service} from file: ${filename}`);
        // Delete the output directory if it already exists
        const output_path = path.join(outputs_dir, service);
        if (fs.existsSync(output_path)) {
            fs.rmdirSync(output_path, { recursive: true });
        }
        // Create the output directory
        fs.mkdirSync(output_path, { recursive: true });
        const jsonSchema = process_resources(service, aws_service, file_contents);
        let openAPIDoc = {};
        openAPIDoc['openapi'] = '3.0.0';
        openAPIDoc['servers'] = [];
        openAPIDoc['info'] = {
            'title': aws_service,
            'description': 'AWS CloudFormation Resource Specification',
            'contact': {
                'name': 'StackQL Studios',
                'url': 'https://stackql.io/',
                'email': 'info@stackql.io',
              },
            'version': `${new Date().toISOString().slice(0, 10)}-stackql-generated`,
        };
        openAPIDoc['components'] = {};
        openAPIDoc['components']['schemas'] = jsonSchema;
        openAPIDoc['paths'] = {};
        // write the openapi doc to the output directory as yaml
        const openapi_file_path = path.join(output_path, `${service}.yaml`);
        fs.writeFileSync(openapi_file_path, yaml.dump(openAPIDoc));
    }
}


function process_all_docs() {
    /*
    Processes all markdown files in the aws-cloudformation-user-guide/doc_source directory that start with 'AWS_'.
    * Gets file contents of each file and passes to process_services().
    */
    fs.readdirSync(docsDir).forEach(filename => {
        if (filename.startsWith('AWS_') && filename.endsWith('.md')) {
            const file_path = path.join(docsDir, filename);
            const file_contents = fs.readFileSync(file_path, 'utf-8');
            process_services(filename, file_contents);
        }
    });
}

process_all_docs();


