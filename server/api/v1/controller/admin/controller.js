import Joi from "joi";
import bcrypt from "bcryptjs";
import status from '../../../../enum/status'
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import commonFunction from "../../../../helper/util";
import {
    userServices
} from "../../services/user";
const {
    paginateSearch,
    insertManyUser,
    createAddress,
    checkUserExists,
    emailMobileExist,
    createUser,
    findUser,
    subAdminList,
    updateUser,
    updateUserById,
    userCount,
    findAllUsers,
    findAllUserss,
    findAllLocalUsers,
    findUsersByOrganization,
    createWarehouse,
    findWarehouse,
    tokenBlackList,
    userList,
    paginateUserList
} = userServices;
import db from "../../../../database";
const { user } = db;
import {Op} from "sequelize";
export class adminController {


    /**
     * @swagger
     * /admin/adminLogin:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: login
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: email
     *         description: email of admin
     *         in: formData
     *         required: true
     *       - name: password
     *         description: password of admin
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Login successfully.
     *       404:
     *         description: Admin not Found.
     *       500:
     *         description: Internal server error.
     *       501:
     *         description: Something went wrong.
     */
    async adminLogin(req, res, next) {
        const validSchema = {
            email: Joi.string().required(),
            password: Joi.string().required(),
        };
        try {
            const validBody = await Joi.validate(req.body, validSchema);
            const {
                email,
                password
            } = validBody;
            let user, check, token, data;
            user = await findUser({
                email: email,
                status: status.ACTIVE,
                userType: {
                    [Op.in]: [userType.ADMIN, userType.SUPERADMIN, userType.CLIENT, userType.DIVISION, userType.TECHNICIAN]
                },
            });
            if (!user) {
                console.log("========>>>>>>", user);
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            check = await bcrypt.compareSync(password, user.password);
            if (check == false) {
                throw apiError.invalid(responseMessage.INCORRECT_LOGIN);
            }
            token = await commonFunction.getToken({
                id: user.id,
                email: user.email,
                userType: user.userType,
            });
            data = {
                id: user.id,
                walletAddress: user.walletAddress,
                userType: user.userType,
                token: token,
            };
            return res.json(new response(data, responseMessage.LOGIN));
        } catch (error) {
            return next(error);
        }
    }
}
export default new adminController();