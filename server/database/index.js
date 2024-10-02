import fs from 'fs';
import path from 'path';
const basename = path.basename(__filename);
import Sequelize from 'sequelize';
import dbConfig from '../../config/dbConfig';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const config = {
    host: dbConfig.db_host,
    port: dbConfig.db_port,
    dialect: dbConfig.db_dialect || 'mysql',
    operatorsAliases: 0,
    define: {
        freezeTableName: false,
        underscored: true,
        undesrcoredAll: true,
        timestamps: true,
    },
    pool: {
        max: dbConfig.db_pool.max,
        min: dbConfig.db_pool.min,
        acquire: dbConfig.db_pool.acquire,
        idle: dbConfig.db_pool.idle,
    },
    logging: function (str) {
        console.log(str + '\n');
    },
};
const sequelize = process.env.DB_URL ?
    new Sequelize(process.env.DB_URL, config) :
    new Sequelize(dbConfig.db_name, dbConfig.db_user_name, dbConfig.db_password, config);
sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });
const db = {};
fs.readdirSync(path.join(__dirname, 'models'))
    .filter((file) => {
        return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
    })
    .forEach((file) => {
        const model = require(path.join(__dirname, 'models', file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
        sequelize.fn()
    });

Object.keys(db).forEach((modelName, i) => {
    console.log(i, modelName);
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});
db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
