This is a temporary document. The manual steps described here should be automated at part of the deployment process.

Build the server app:
```bash
nx build server
```

Install dependencies of the server app after building it:
```bash
cd dist/apps/server
npm i --only=production
```
