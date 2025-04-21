const dotenv = require("dotenv").config();

 






const environment = process.env["NODE_ENV"] || 'development';
// const environment = process.env.NODE_ENV || 'development';

// console.log("process.env------" ,process.env);
// console.log("1111111" ,process.env["NODE_ENV"]);
// console.log("22222222" ,AAA["NODE_ENV"]);
console.log("backend running NODE_ENV -" , process.env["NODE_ENV"]);



const config = require('./knexfile')[environment];
console.log("connection config details",config);
const DBConnection = require('knex')(config);
 
 

module.exports = DBConnection;
