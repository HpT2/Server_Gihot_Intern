const mysql = require('mysql');

var db_config = {
    host: "127.0.0.1",
    user: "gihot",
    password: "gihot123",
    database: "game_db"
};

var con = mysql.createPool(db_config, (res : any)=>console.log(res));

module.exports = con;