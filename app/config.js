const mysql = require('mysql2');

const connect = mysql.createConnection({
    user: "",
    host: "",
    database: "",
    password: ""
})

module.exports = connect;

