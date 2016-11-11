# sequelize migrations
This folder contains various migrations run by `sequelize-cli`

There are some one-off notes that we should record:

- `queryInterface` reference: http://docs.sequelizejs.com/en/v3/docs/migrations/#functions
- We require transactions to be used as `sequelize-cli` doesn't inherently use them for each `up`/`down`
    - https://github.com/sequelize/cli/issues/133
- We prevent conflicting ids (e.g. 2 `002-*.js` via a forked `sequelize-cli`)
- We use singular form for models to keep syntax: `new Application`
- We use plural form for tables to keep query syntax: `SELECT * FROM applications;`
    - Sequelize supports this by default via inflection, if it didn't, then we would stick to singular everywhere
