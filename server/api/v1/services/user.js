'use strict';
//import ApiError from '../../../helper/apiError';
//import responseMessage from '../../../../assets/responseMessage';
import db from '../../../database';
const { channel, user, sequelize, organization, site, role, permission, tokenBlacklist } = db;
const { Op } = require('sequelize');
import * as path from "path";
//import userType from '../../../enums/userType';
const root = path.normalize(`${__dirname}/../..`);
//import status from '../../../enums/status';

const userServices = {

	checkUserExists: async (obj) => {
		return await user.findOne({
			where: obj,
		});
	},

	createUser: async (body) => {
		let cms = await user.create(body);
		return cms;
	},

	findWarehouse: async (query) => {
		return await site.findOne({
			where: query
		});
	},
	createWarehouse: async (body) => {
		let cms = await site.create(body);
		return cms;
	},
	findUserById: async id => {
		return await user.findOne({
			attributes: {
				include: [[sequelize.fn('SUM', db.sequelize.col('sender.txn_amount')), 'totalTxn'],
				[sequelize.fn('MAX', db.sequelize.col('sender.txn_amount')), 'highestTxn'],
				[sequelize.fn('MAX', db.sequelize.col('sender.created_at')), 'last_txn_date']
				]
			},
			where: {
				id
			},
			group: ['user.id', 'selfie.id', 'additional.id'],
			include: [
				{
					model: transaction,
					as: 'sender',
					attributes: []
				},
				{
					model: document,
					as: 'selfie',
					required: false,
					where: { type: DocumentType.SELFIE }
				},
				{
					model: document,
					as: 'additional',
					required: false,
					where: { type: DocumentType.ADDITIONAL_DOC }
				}
			],
		});
	},

	userList: async (query) => {
		return await user.findAll({
			where: query
		});
	},

	findUser: async (query) => {
		return await user.findOne({
			where: query
		});
	},

	findUserByCheckId: async check_id => {
		return await user.findOne({
			where: {
				check_id
			},
		});
	},

	checkUserCount: async (mobile, country_code) => {
		const count = await user.count({
			where: {
				mobile, country_code
			},
		});
		if (count > 0) {
			throw ApiError.badRequest(responseMessage.USER_EXISTS);
		}
		return;
	},

	// updateUser: async (updatedValues, id) => {
	// 	console.log("dffdfds99", updatedValues, id)
	// 	const userDetail = await user.update(updatedValues, {
	// 		where: { id: id },
	// 		returning: true
	// 	});
	// 	return userDetail[1];
	// },

	updateUser: async (id, updatedValues) => {
		return await user.update(updatedValues, { where: { id: id }, returning: true });
	},

	checkUserById: async (id) => {
		const userDetail = await user.findOne({
			where: {
				id
			},
		});
		if (userDetail === null) {
			throw ApiError.unauthorized(responseMessage.USER_NOT_FOUND);
		}
	},


	findAll: async (country) => {
		return await user.findAll({ where: { is_blocked: false, country: country } });
	},

	findAllUsers: async (validBody, pageInfo) => {
		const { search, fromDate, toDate } = validBody
		let query = { user_type: { [Op.notIn]: [userType.SUPERADMIN, userType.ADMIN] }, status: { [Op.ne]: status.DELETE } }
		let condition = []
		condition.push(query)
		if (search) {
			condition.push(
				{
					[Op.or]: [
						{
							firstName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('first_name')), 'LIKE', '%' + search.toLowerCase() + '%')
						},
						{
							lastName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('last_name')), 'LIKE', '%' + search.toLowerCase() + '%')
						},
						{
							email: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('user.email')), 'LIKE', '%' + search.toLowerCase() + '%')
						},
						{
							userName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('user_name')), 'LIKE', '%' + search.toLowerCase() + '%')
						},
					]
				}
			)
		}
		let includeArr = [{
			model: organization,
			attributes: ['name', 'id']
		}, {
			model: role,
			attributes: ['roleName'],
			include: [{
				model: permission,
				attributes: ['role_id', 'permission']
			}]
		}];
		if (fromDate && toDate) {
			condition.push({
				created_at: {
					[Op.between]: [fromDate, toDate]
				}
			})
		}
		return await user.findAndCountAll({
			where: condition, order: [['created_at', 'DESC']], include: includeArr, limit: pageInfo.limit,
			offset: pageInfo.skip
		});
	},

	findUsers: async (validBody, userid, id, pageInfo) => {
		const { search, fromDate, toDate } = validBody
		let query = { user_type: { [Op.in]: [userType.USER] }, organization_id: id, status: { [Op.ne]: status.DELETE }, id: { [Op.ne]: userid } }
		let condition = []
		condition.push(query)
		let includeArr = [{
			model: organization,
			attributes: ['name']
		}, {
			model: role,
			attributes: ['roleName'],
			include: [{
				model: permission,
				attributes: ['role_id', 'permission']
			}]
		}];
		if (search) {
			condition.push(
				{
					[Op.or]: [
						{
							firstName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('first_name')), 'LIKE', '%' + search.toLowerCase() + '%')
						},
						{
							lastName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('last_name')), 'LIKE', '%' + search.toLowerCase() + '%')
						},
						{
							email: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('user.email')), 'LIKE', '%' + search.toLowerCase() + '%')
						},
						{
							userName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('user_name')), 'LIKE', '%' + search.toLowerCase() + '%')
						},
					]
				}
			)
		}
		if (fromDate && toDate) {
			condition.push({
				created_at: {
					[Op.between]: [fromDate, toDate]
				}
			})
		}
		return await user.findAndCountAll({
			where: condition, order: [['created_at', 'DESC']], include: includeArr, limit: pageInfo.limit,
			offset: pageInfo.skip
		});
	},


	increaseLoginAttempt: async (id) => {
		const userDetail = await user.update({ login_attempt: sequelize.literal('login_attempt + 1') }, { where: { id }, returning: true });
		return userDetail[1];
	},

	resetLoginAttempt: async (id) => {
		return await user.update({ login_attempt: 0 }, { where: { id } })
	},

	listUsers: async (country, pageInfo, filter) => {
		let conditionArr = [];
		let txnCndnArr = [];
		const { search, kyc_status, is_blocked, from_date, to_date, sort, source_advert } = filter;
		conditionArr.push({ country: country });
		if (search) {
			conditionArr.push({
				[Op.or]: [
					{
						first_name: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('first_name')), 'LIKE', '%' + search.toLowerCase() + '%')
					},
					{
						last_name: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('last_name')), 'LIKE', '%' + search.toLowerCase() + '%')
					},
					{
						email: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('email')), 'LIKE', '%' + search.toLowerCase() + '%')
					},
					{
						mobile: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('mobile')), 'LIKE', '%' + search.toLowerCase() + '%')
					},
					{
						ppc_number: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('ppc_number')), 'LIKE', '%' + search.toLowerCase() + '%')
					}
				]
			});
		}
		if (kyc_status) {
			conditionArr.push({
				kyc_status
			})
		}
		if (is_blocked != undefined) {
			conditionArr.push({
				is_blocked
			})
		}
		if (from_date && to_date) {
			conditionArr.push({
				created_at: { [Op.between]: [from_date, to_date] }
			})
		}
		if (source_advert) {
			conditionArr.push({
				source_advert
			})
		}
		const totalTxnCndn = sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('sender.txn_amount')), 0);
		if (sort) {
			if (sort == SortType.TRANSACTION) {
				const txn_to_date = new Date();
				const txn_from_date = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
				txnCndnArr.push({
					created_at: { [Op.between]: [txn_from_date, txn_to_date] }
				})
			}
		}
		const orderCndn = sort ? totalTxnCndn : 'created_at';
		return user.findAll({
			attributes: {
				include: [[totalTxnCndn, 'totalTxn']]
			},
			group: ['user.id'],
			include: [
				{
					model: transaction,
					as: 'sender',
					attributes: [],
					duplicating: false,
					required: false,
					where: {
						[Op.and]: txnCndnArr
					}
				}
			],
			where: {
				[Op.and]: conditionArr
			},
			limit: pageInfo.limit,
			offset: pageInfo.skip,
			order: [[orderCndn, 'DESC']],
		})
	},

	userCount: async (query) => {

		return await user.count({
			where: query
		});
	},

	uploadCSV: async () => {
		return new Promise((resolve, reject) => {
			let stream = fs.createReadStream(`${root}/v1/services/sampledata.csv`);
			let csvData = [];
			let csvStream = fastcsv
				.parse()
				.on("data", function (data) {
					csvData.push(data);
				})
				.on("end", function () {
					csvData.shift();
					resolve(csvData);
				});

			stream.pipe(csvStream);
		})
	},

	findByReferral: async (referral_code) => {
		return await user.findOne({ where: { referral_code } });
	},

	findAllLocalUsers: async (validBody, id) => {
		let condition = []
		const { search, fromDate, toDate } = validBody;
		condition.push({ userType: userType.USER, organization_id: id, status: { [Op.ne]: status.DELETE } })
		let includeArr = [{
			model: organization,
		}];
		if (search) {
			condition.push({
				[Op.or]: [{
					firstName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('first_name')), 'LIKE', '%' + search.toLowerCase() + '%')
				},
				{
					lastName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('last_name')), 'LIKE', '%' + search.toLowerCase() + '%')
				},
				{
					email: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('email')), 'LIKE', '%' + search.toLowerCase() + '%')
				},]
			})
		}
		if (fromDate && toDate) {
			conditionArr.push({
				created_at: { [Op.between]: [fromDate, toDate] }
			})
		}
		return await user.findAndCountAll({ where: condition, order: [['created_at', 'DESC']], include: includeArr });
	},

	findUsersByOrganization: async (validBody, id, pageInfo) => {
		const { search, fromDate, toDate } = validBody
		let query = { status: { [Op.ne]: status.DELETE }, organization_id: id }
		let condition = []
		condition.push(query)
		let includeArr = [{
			model: organization,
		}];
		if (search) {
			condition.push({
				[Op.or]: [
					{
						firstName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('first_name')), 'LIKE', '%' + search.toLowerCase() + '%')
					},
					{
						lastName: db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('last_name')), 'LIKE', '%' + search.toLowerCase() + '%')
					},
				]
			});
		}

		if (fromDate && toDate) {
			condition.push({
				created_at: {
					[Op.between]: [fromDate, toDate]
				}
			})
		}
		return await user.findAndCountAll({
			where: condition, order: [['created_at', 'DESC']], include: includeArr, limit: pageInfo.limit,
			offset: pageInfo.skip
		});
	},
	findAllUserss: async (query) => {
		return await user.findAll({
			where: query, order: [['created_at', 'DESC']]
		});
	},

	tokenBlackList: async (insertObj) => {
		return await tokenBlacklist.create(insertObj);
	},

	paginateUserList: async (query, option) => {

		if (option && option.limit && !isNaN(option.limit)) {

			return await user.findAndCountAll({
				where: query, order: [[(!option.orderBy) ? 'created_at' : option.orderBy, 'DESC']], limit: option.limit,
				offset: (option.page - 1) * option.limit,
			});
		} else {
			return await user.findAll({
				where: query, order: [[(!option.orderBy) ? 'created_at' : option.orderBy, 'ASC']]
			});
		}
	},
};
module.exports = { userServices };
