
require('dotenv').config();
const path = require('path');

module.exports = {

  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      port: process.env.DATABASE_SQL_PORT,
      connectTimeout: 10000 // 10 seconds
    },
    migrations: {
      directory: path.join(__dirname, 'db/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'db/seeds/production'),
    },
    pool: { min: 0, max: 20 }
  },


  
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      port: process.env.DATABASE_SQL_PORT,
      connectTimeout: 10000 // 10 seconds
    },
    migrations: {
      directory: path.join(__dirname, 'db/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'db/seeds/production'),
    },
    pool: { min: 0, max: 20 }
  }
};
















// require('dotenv').config();
// const { log } = require('console');
// const path = require('path');


// module.exports = {
  

  
//   development: {
//     client: 'mysql2',
//     connection: {
//       host: process.env.DATABASE_HOST,
//       user: process.env.DATABASE_USER,
//       password: process.env.DATABASE_PASSWORD,
//       database: process.env.DATABASE_NAME,
//       port:process.env.DATABASE_SQL_PORT,
//       connectTimeout: 10000 // 10 seconds
//     },migrations: {
//       directory: __dirname + '/db/migrations',
//     },
//   seeds: {
//       directory: __dirname + '/db/seeds/production',
//     },
//     pool: { min: 0, max: 20 }
//   }
//   // Add other environments (staging, production) as needed
// };

