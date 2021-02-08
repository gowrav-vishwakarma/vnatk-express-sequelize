const sequelize = require('sequelize')
const Op = sequelize.Op

module.exports = {
    "development": {
        "username": process.env.DB_USER_NAME || "root",
        "password": process.env.DB_PASSWORD || "winserver",
        "database": process.env.DB_DATABASE || "frendy_service_user",
        "host": process.env.DB_HOST || "127.0.0.1",
        "dialect": "mysql",
        operatorsAliases: { $lt: Op.lt, $gt: Op.gt, $like: Op.like },
        "dialectOptions": {
            "dateStrings": true,
            "typeCast": true
        },
        "timezone": '+05:30'
    },
    "test": {
        "username": "root",
        "password": null,
        "database": "database_test",
        "host": "127.0.0.1",
        "dialect": "sqlite",
        "operatorsAliases": false,
        "dialectOptions": {
            "useUTC": false, //for reading from database
            "dateStrings": true,
            "typeCast": true
        },
    },
    "production": {
        "username": process.env.DB_USER_NAME || "root",
        "password": process.env.DB_PASSWORD || null,
        "database": process.env.DB_DATABASE || null,
        "host": process.env.DB_HOST || "127.0.0.1",
        "port": process.env.DB_PORT || "3306",
        "dialect": "mysql",
        "operatorsAliases": false,
        "dialectOptions": {
            "useUTC": false, //for reading from database
            "dateStrings": true,
            "typeCast": true
        },
        "timezone": '+05:30'
    }
}