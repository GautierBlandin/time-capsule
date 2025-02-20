First thing to tackle:
At schedule time part.
In what order ?

Let's break it down into code items to write:
- UI code
- Lambda code 
- Infrastructure code (pulumi)

We'll start with the lambda code.
Let's break it down further:

Lambda code:
- Handler (entry point)
- Adapter (API Gateway event --> Custom input)
- Use-case (main business logic)
- TimeCapsuleRepository (abstraction in front of dynamodb)

Lambda code and infrastructure code for the lambda and connecting components (API Gateway and DDB) is DONE.

Next step: UI code.

We're going to make an SPA using react.
The SPA will be deployed on S3 + Cloudfront.
