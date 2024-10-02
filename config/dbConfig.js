import config from "config"
module.exports = {
	db_host: config.get("databaseHost"),
	db_user_name: config.get("databaseUser"),
	db_password: config.get("databasePassword"),
	db_name: config.get("databaseName"),
	db_dialect: config.get("DB_DIALECT"),
	db_pool: {
		max: 5,
		min: 0,
		acquire: 0,
		idle: 0,
	},
	db_port: config.get("databasePort"),
};
