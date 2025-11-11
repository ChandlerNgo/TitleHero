# For both, ensure you are in the server directory

# Create Admin:

```
node
const { createAdmin } = require(‘./auth/users’);
createAdmin(‘username’, ‘password’, ‘permissions’).then(console.log).catch(console.error);

```

# Create User:
```
node
const { createUser } = require(‘./auth/users’);
createUser(‘username’, ‘password’, ‘permissions’).then(console.log).catch(console.error);
```