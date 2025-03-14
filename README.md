# Timecapsules

Timecapsules is an application that allows users to write messages to themselves or others, scheduled to be delivered at a future date. This project fosters reflection and anticipation by enabling users to send their thoughts into the future.

## Table of Contents

- [Project Overview](#project-overview)
- [Codebase Architecture](#codebase-architecture)
    - [Key Components](#key-components)
    - [Directory Structure](#directory-structure)
- [Deployment Process](#deployment-process)
    - [Infrastructure Deployment](#infrastructure-deployment)
- [Prerequisites](#prerequisites)
    - [Sendgrid API Key](#sendgrid-api-key)
- [Testing](#testing)
- [Potential Improvements](#potential-improvement-for-real-prod-and-improved-maintainability)

## Project Overview

The Timecapsules application consists of a serverless backend deployed on AWS and a React-based frontend. Users can create time capsules through a web interface, which are then stored and sent at the specified future date.

## Codebase Architecture

The project is structured using an Nx workspace, which provides a monorepo setup for efficient development and task-based workflows.

### Key Components

1. **Frontend (UI)**: React-based single-page application deployed on S3 and served through CloudFront.
2. **Backend (Server)**: Node.js with TypeScript, using AWS Lambda, API Gateway, and EventBridge.
3. **Database**: Amazon DynamoDB for storing and retrieving time capsule data.
4. **Infrastructure**: AWS services managed with Pulumi IaC.

### Directory Structure

- `apps/`: Contains the main applications
    - `infrastructure/`: Pulumi-based AWS infrastructure code
    - `server/`: Backend serverless handlers
    - `ui/`: Frontend React application
- `libs/`: Shared libraries and modules
    - `server/`: Backend-related libraries
        - `dynamodb/`: DynamoDB client and utilities
        - `timecapsule/`: Core business logic and models
        - `di/`: Dependency injection utilities
- `docs/`: Project documentation
    - `specifications.md`: Functional and technical specifications with architecture diagrams

## Deployment Process

The deployment process involves several steps:

### Infrastructure Deployment

- Set your AWS credentials:
  ```
  export AWS_ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXXX
  export AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXd
  ```
- Deploy the infrastructure (build steps are automatically triggered thanks to Nx):
  ```
  nx deploy infrastructure
  ```

### Prerequisites

#### Sendgrid API Key
- Setup a Sendgrid account and create an API key
- In your AWS account, create a parameter store entry with the key `sendgrid-api-key` and the value of the Sendgrid API key

## Testing

In order to run all unit tests, run the following command:

```bash
nx run-many -t test
```

# Potential improvement for real prod and improved maintainability

## Technical
- Setup CI/CD to run tests, lint, and typecheck, with auto deploy to prod on pushes to main
- Use a HTTP framework for routing and other utilities at the api lambda handler level
- If /libs/server/timecapsule grows further, split it into directories (e.g. ports, infra, domain, core)
- Split App.tsx into multiple components and separate business logic from UI
- Implement a retry mechanism for failed sent time capsules, and notifications for time capsules that fail despite retry
(split send email lambda into two, one to push ready-to-send timecapsule IDs to SQS and one to actually send the email. Add a DLQ connected to SNS)
- Improve the design of the GSI on the time capsule table (GSI PK should be high-cardinality, currently it is the opposite).
- Setup a local dynamodb instance using docker and implement tests for the TimeCapsuleDynamoDBRepository
- Enable UI developers to bypass cloudfront and directly access the API of their stack to avoid needing to deploy
their UI to S3 to test changes
- Remove hard-coded sender address
- Remove hard-coded domain name

## Functional
- Unsubscribe mechanism (enable an email address owner to no longer receive time capsules)
