import config from "config";
import jwt from "jsonwebtoken";
import db from '../database'
import apiError from './apiError';
import responseMessage from '../../assets/responseMessage';

module.exports = {
  verifyToken(req, res, next) {
    if (req.headers.token) {
      jwt.verify(req.headers.token, config.get('jwtsecret'), async (err, result) => {
        if (err) {
          return res.send({ responseCode: 401, responseMessage: "Invalid token", responseResult: err });
        }
        else {
          var result2 = await db.user.findOne({
            where: {
              id: result.id
            }
          })
          var result3 = await db.tokenBlacklist.findOne({
            where: {
              token: req.headers.token
            }
          })
          if (!result2) {
            return res.send({ responseCode: 404, responseMessage: "User not found." });
          }
          else {
            if (result2.status == "BLOCK") {
              return res.send({ responseCode: 403, responseMessage: "Your account is blocked." });
            }
            else if (result2.status == "DELETE") {
              return res.send({ responseCode: 401, responseMessage: "Your account is deleted." });
            }
            else if(result3){
              return res.send({ responseCode: 401, responseMessage: "Unauthenticated user" });
            }
            else {
              req.userId = result.id
              next();
            }
          }
        }
      })
    } else {
      throw apiError.badRequest(responseMessage.NO_TOKEN);
    }
  },
  
  verifyTokenBySocket: (token) => {
    return new Promise((resolve, reject) => {
      try {
        if (token) {
          jwt.verify(token, config.get('jwtsecret'), async (err, result) => {
            if (err) {
              reject(apiError.unauthorized());
            }
            else {
              var result2 = await db.user.findOne({ where: { id: result.id } })
              if (result2.status == "BLOCK") {
                reject(apiError.forbidden(responseMessage.BLOCK_BY_ADMIN));
              }
              else if (result2.status == "DELETE") {
                reject(apiError.unauthorized(responseMessage.DELETE_BY_ADMIN));
              }
              else {
                resolve(result2.id);
              }
            }
          })
        } else {
          reject(apiError.badRequest(responseMessage.NO_TOKEN));
        }
      }
      catch (e) {
        reject(e);
      }
    })
  }


 
}