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
