#!/bin/bash

ENV_TYPE=$(/opt/elasticbeanstalk/bin/get-config environment -k SSM_PREFIX)
# ENV_VARS=("SGID_CLIENT_ID" "SGID_CLIENT_SECRET" "SGID_PRIVATE_KEY") # Add any additional env vars to this array


ENV_VARS=("SGID_CLIENT_ID")

echo "Set AWS region"
aws configure set default.region ap-southeast-1

echo "Creating env vars file.."
touch /opt/elasticbeanstalk/deployment/env

for ENV_VAR in "${ENV_VARS[@]}"; do
  echo "Running for this ${ENV_TYPE}"
  echo "Fetching ${ENV_VAR} from SSM"
  VALUE=$(aws ssm get-parameter --name "${ENV_TYPE}_${ENV_VAR}" --with-decryption --query "Parameter.Value" --output text)
  echo "${ENV_VAR}=${VALUE}"
  echo "${ENV_VAR}=${VALUE}" >> /opt/elasticbeanstalk/deployment/env
  echo "Saved ${ENV_VAR}"
done
