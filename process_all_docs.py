import os, shutil

outputs_dir = 'outputs'

def camel_to_snake_case(input_str):
    """
    Converts a camel case string to a snake case string.
    """
    exceptions = {
        "EC2": "ec2",
        "ACMPCA": "acmpca",
        "AmazonMQ": "amazon_mq",
        "AmplifyUIBuilder": "amplify_ui_builder",
        "APS": "aps",
        "CE": "ce",
        "CUR": "cur",
        "DAX": "dax",
        "DLM": "dlm",
        "DMS": "dms",
        "DocDB": "doc_db",
        "DocDBElastic": "doc_db_elastic",
        "DynamoDB": "dynamo_db",
        "ECR": "ecr",
        "ECS": "ecs",
        "EFS": "efs",
        "EKS": "eks",
        "EMR": "emr",
        "EMRContainers": "emr_containers",
        "EMRServerless": "emr_serverless",
        "FIS": "fis",
        "FMS": "fms",
        "FSx": "fsx",
        "IAM": "iam",
        "IoT": "iot",
        "IoT1Click": "iot1_click",
        "IoTAnalytics": "iot_analytics",
        "IoTCoreDeviceAdvisor": "iot_core_device_advisor",
        "IoTEvents": "iot_events",
        "IoTFleetHub": "iot_fleet_hub",
        "IoTFleetWise": "iot_fleet_wise",
        "IoTSiteWise": "iot_site_wise",
        "IoTTwinMaker": "iot_twin_maker",
        "IoTWireless": "iot_wireless",
        "IVS": "ivs",
        "KMS": "kms",
        "MemoryDB": "memory_db",
        "MSK": "msk",
        "MWAA": "mwaa",
        "OpsWorksCM": "ops_works_cm",
        "QLDB": "qldb",
        "RAM": "ram",
        "RDS": "rds",
        "RUM": "rum",
        "SDB": "sdb",
        "SES": "ses",
        "SNS": "sns",
        "SQS": "sqs",
        "SSM": "ssm",
        "SSMContacts": "ssm_contacts",
        "SSMIncidents": "ssm_incidents",
        "SSO": "sso",
        "VoiceID": "voice_id",
        "WAF": "waf",
        "WAFRegional": "waf_regional",
        "WAFv2": "waf_v2",
        "XRay": "xray",
    }
    result = ""
    if input_str in exceptions:
        return exceptions[input_str]
    else:
        for i, char in enumerate(input_str):
            if char.isupper() and i > 0:
                result += "_"
            result += char.lower()
        return result

def process_resources(service, file_contents):
    """
    Processes a single markdown file.
    """
    lines = file_contents.split('\n')
    resource_section = False
    for line in lines:
        if line.startswith('**Resource types**'):
            resource_section = True
        elif resource_section and line.startswith('+'):
            parts = line.strip().split()
            resource = parts[1].split('](')[0].strip('[').split('::')[-1]
            resource_file_name = parts[1].split('](')[1].strip(')')
            print(service)
            print(resource)
            print(resource_file_name)

def process_services(filename, file_contents):
    """
    Processes a single markdown file.
    """
    service = camel_to_snake_case(filename[4:-3])
    print(f"processing service: {service} from file: {filename}")
    # Delete the output directory if it already exists
    output_path = os.path.join(outputs_dir, service)
    if os.path.exists(output_path):
        shutil.rmtree(output_path)
    # Create the output directory
    os.makedirs(output_path)
    process_resources(service, file_contents)

def process_all_docs():
    """
    Processes all markdown files in the aws-cloudformation-user-guide/doc_source directory that start with 'AWS_'.
    """
    docs_dir = 'aws-cloudformation-user-guide/doc_source'
    for filename in os.listdir(docs_dir):
        if filename.startswith('AWS_') and filename.endswith('.md'):
            file_path = os.path.join(docs_dir, filename)
            with open(file_path, 'r') as f:
                file_contents = f.read()
            f.close()
            process_services(filename, file_contents)


if __name__ == '__main__':
    process_all_docs()
