import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

const outputs_dir = 'outputs';
const docsDir = './aws-cloudformation-user-guide/doc_source';

function isName(inputString) {
  console.log(inputString);
  const pattern = /`([^`]+)`.*<a[^>]+name="([^"]+)"/;
  const match = inputString.match(pattern);
  if (match) {
    return match[1];
  } else {
    return false;
  }
}

function extractProperties(properties){
  let result = [];
  for (let i = 0; i < properties.length; i++) {
    console.log(properties[i]);
    let propSet = {};
    // remove named fields
    for (let j = 0; j < properties[i].length; j++) {
      let thisProp = properties[i][j];
      const name = isName(thisProp);


      
      properties[i].splice(j, 1);
      if (name) {
        result.push({name: name, index: properties[i][j].index});
      }

    }

    

    // for (let j = 0; j < properties[i].length; j++) {
    //   let thisProp = properties[i][j];
    //   const name = isName(thisProp.line);
    //   properties[i].splice(j, 1);
    //   console.log(properties[i]);

    //   if (name) {
    //     result.push({name: name, index: properties[i][j].index});
    //   }
    // }
  }

  return result;
}


function getProperties(lines, propertiesIndex){
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
      // currentList.push({line: trimmedLine, index: index});
      currentList.push(line);
    }
  });
  
  // Add last list to result
  if (currentList.length > 0) {
    result.push(currentList);
  }
  return result;
}


function processResource(resourceFileName, service, awsService, resource, awsResource) {
  const markdown = fs.readFileSync(path.join(docsDir, resourceFileName), 'utf-8');

  // read each line in the markdown file
  const lines = markdown.split('\n');

  // find the index of the Properties heading
  const propertiesIndex = lines.findIndex(line => line.startsWith('## Properties'));

  const resProperties = extractProperties(getProperties(lines, propertiesIndex));

  return resProperties;

}

function camelToSnakeCase(inputStr) {
    const exceptions = {
      EC2: "ec2",
      ACMPCA: "acmpca",
      AmazonMQ: "amazon_mq",
      AmplifyUIBuilder: "amplify_ui_builder",
      APS: "aps",
      CE: "ce",
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
      EMR: "emr",
      EMRContainers: "emr_containers",
      EMRServerless: "emr_serverless",
      FIS: "fis",
      FMS: "fms",
      FSx: "fsx",
      IAM: "iam",
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
      KMS: "kms",
      MemoryDB: "memory_db",
      MSK: "msk",
      MWAA: "mwaa",
      OpsWorksCM: "ops_works_cm",
      QLDB: "qldb",
      RAM: "ram",
      RDS: "rds",
      RUM: "rum",
      SDB: "sdb",
      SES: "ses",
      SNS: "sns",
      SQS: "sqs",
      SSM: "ssm",
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
    Processes a single markdown file.
    */
    const lines = file_contents.split('\n');
    let resource_section = false;
    for (let line of lines) {
        if (line.startsWith('**Resource types**')) {
            resource_section = true;
        } else if (resource_section && line.startsWith('+')) {
            const parts = line.trim().split(/\s+/);
            const fq_resource = parts[1].split('](')[0].trim('[');
            const aws_resource = parts[1].split('](')[0].trim('[').split('::').slice(-1)[0];
            const resource = camelToSnakeCase(aws_resource);
            const resource_file_name = parts[1].split('](')[1].slice(0, -1);
            // console.log(fq_resource);
            // console.log(service);
            // console.log(resource);
            // console.log(resource_file_name);
            console.log(processResource(resource_file_name, service, aws_service, resource, aws_resource));
            break;
        }
    }
}

function process_services(filename, file_contents) {
    /*
    Processes a single markdown file.
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
        process_resources(service, aws_service, file_contents);
    }
}


function process_all_docs() {
    /*
    Processes all markdown files in the aws-cloudformation-user-guide/doc_source directory that start with 'AWS_'.
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


