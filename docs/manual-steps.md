This is a temporary document. The manual steps described here should be automated at part of the deployment process.

# Server

Build the server app:
```bash
nx build server
```

Install dependencies of the server app after building it:
```bash
cd dist/apps/server
npm i --only=production
```

# Infrastructure

Set AWS credentials:

```bash
export AWS_ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXXX
export AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
