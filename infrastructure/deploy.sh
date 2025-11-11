#!/bin/bash

BUCKET_NAME="cf-templates-b73zafb13eqb-eu-north-1"
TEMPLATE_URL="https://${BUCKET_NAME}.s3.amazonaws.com/main.yaml"
STACK_NAME="data-service-infrastucture"
REGION="eu-north-1"

STACK_CMD="CREATE"
WAIT_COMMAND="stack-create-complete"

echo "Uploading templates..."
aws s3 sync . s3://$BUCKET_NAME --delete --exclude "*" --include "*.yaml"

STACK_STATUS=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region $REGION --output text --query 'Stacks[0].StackStatus' 2> /dev/null)
CMD_STATUS=$?

echo "Stack has status: $STACK_STATUS"

if [ $CMD_STATUS -eq 0 ]; then
    STACK_CMD="UPDATE"
    WAIT_COMMAND="stack-update-complete"
fi

CHANGE_SET_ID=$(aws cloudformation create-change-set \
    --stack-name $STACK_NAME \
    --region $REGION \
    --template-url $TEMPLATE_URL \
    --change-set-name "$STACK_NAME-changes" \
    --change-set-type $STACK_CMD \
    --parameters "ParameterKey=BucketName,ParameterValue=$BUCKET_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --query "Id" \
    --output text
)
CMD_STATUS=$?

echo $CHANGE_SET_ID

if [[ ! $CMD_STATUS -eq 0 ]]; then
    echo "Change set create failed"
    exit 1
fi

echo "Waiting for change set to be created..."
aws cloudformation wait change-set-create-complete --change-set-name $CHANGE_SET_ID --region $REGION
aws cloudformation describe-change-set --change-set-name $CHANGE_SET_ID --region $REGION --output table

echo -n "Proceed y/n? "
read USER_INPUT
if [[ $USER_INPUT != 'y' ]]; then
    echo "Removing change set..."
    aws cloudformation delete-change-set --change-set-name $CHANGE_SET_ID --region $REGION
    exit 1
fi

aws cloudformation execute-change-set --change-set-name $CHANGE_SET_ID --region $REGION
aws cloudformation wait $WAIT_COMMAND --stack-name $STACK_NAME --region $REGION
