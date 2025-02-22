# Functional specifications

Basic idea:
Time Capsule Messages: An app where users write messages to themselves or others, scheduled to be delivered at a future date, fostering reflection or anticipation.

Core workflow:
- The user goes to the website.
- The user enters a message, an email address, a date and time for the message to be delivered, a name for who is sending the message.
- The users clicks a button to submit their message, and they receive an acknowledgement that their request has been processed.
- At the specified date and time, an email is sent to the specified address with the message.

# Architectural considerations

The application's backend must be deployed on AWS using serverless technologies (notably lambda, api gateway, event-bridge, sqs, dynamodb, step-functions).

# Technological stack

The application's backend must be written in typescript with node.js.
The application's frontend must be written in typescript using the react framework and deployed as an SPA on S3 + cloudfront.

# Architecture diagrams

## At schedule time
```mermaid
flowchart LR
    UI --POST timecapsule--> API[API Gateway]
    API --> Lambda[API Lambda]
    Lambda --Acknowledge time-capsule received-->UI
    Lambda --Store time-capsule-->DDB
```

## At send time (current implementation)
```mermaid
flowchart LR
    EventBridgeScheduler --Trigger lambda every 1 minute-->Lambda
    Lambda[Send Email Lambda] --Read time-capsules to be sent by date range---> DDB
    Lambda --Trigger send email--> Sendgrid[Sendgrid]
    Lambda --Store time-capsule sent--> DDB
```

## At send time (revised for scalability)
```mermaid
flowchart LR
    EventBridgeScheduler --Trigger lambda every 5 minutes-->Lambda1
    Lambda1[Polling Lambda] --Read time-capsules to be sent by date range--> DDB
    Lambda1 --Publish message to sqs with time-capsule ID--> SQS
    SQS --Trigger send lambda--> Lambda2
    Lambda2[Send Email Lambda] --Read time-capsule to be sent by ID--> DDB
    Lambda2 --Trigger send email--> Sendgrid[Sendgrid]
    Lambda2 --Store time-capsule sent--> DDB
```
