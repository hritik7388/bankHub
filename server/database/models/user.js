'use strict'; 
import status from "../../enum/status"
import userType from "../../enum/userType";
let sequelize = require("../index")
module.exports = (sequelize, DataTypes) => {
	const user = sequelize.define('user', {
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
		},
		firstName: DataTypes.STRING,
		lastName: DataTypes.STRING,
		name: DataTypes.STRING,
		userName: DataTypes.STRING,
		profilePic: DataTypes.STRING,
		isSocial: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		socialId: DataTypes.STRING,
		email: DataTypes.STRING,
		mobile: DataTypes.STRING,
		country_code: DataTypes.STRING(6),
		password: DataTypes.STRING,
		profile_picture: DataTypes.STRING,
		date_of_birth: DataTypes.STRING,
		uniqueId: DataTypes.STRING,
		userType: {
			type: DataTypes.ENUM([userType.ADMIN, userType.CLIENT, userType.DIVISION, userType.SUPERADMIN, userType.TECHNICIAN, userType.USER]),
			defaultValue: userType.USER
		},
 
		permission: DataTypes.TEXT,
		otp_verification: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_approved: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		status: {
			type: DataTypes.STRING,
			values: [
				status.ACTIVE,
				status.BLOCK,
				status.DELETE
			],
			defaultValue: status.ACTIVE
		},
		otp: DataTypes.STRING,
		otp_expire_time: DataTypes.STRING,
		is_online: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		online_time: DataTypes.STRING,
		offline_time: DataTypes.STRING,
		socket_id: DataTypes.STRING,
		last_login_time: DataTypes.DATE,
		coursePageReaded: DataTypes.JSON,
	},
		{
			timestamps: true,
		}
	);

	return user;
};
