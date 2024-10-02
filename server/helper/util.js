import config from "config";
import jwt from 'jsonwebtoken';
import db from "../database"; 
const { infocategory, user, role } = db;
import nodemailer from 'nodemailer';
import cloudinary from 'cloudinary';
import status from "../enum/status"
import userType from "../enum/userType"
//import QRCode from 'qrcode'// import userModel from "../models/user" 
cloudinary.config({
  cloud_name: config.get('cloudinary.cloud_name'),
  api_key: config.get('cloudinary.api_key'),
  api_secret: config.get('cloudinary.api_secret')
});

import fs from "fs";

// const accountSid = config.get('twilio.accountSid');
// const authToken = config.get('twilio.authToken');
// const client = require('twilio')(accountSid, authToken); 
const saltLength = 9;
const generateSalt = len => {
  const set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
  let salt = '';
  let p = 2;
  for (let i = 0; i < len; i += 1) {
    salt += set[p];
    p += 3;
  }
  return salt;
};
/**
 *
 *
 * @param {any} string
 * @returns
 */
const md5 = string => crypto.createHash('md5').update(string).digest('hex');
module.exports = {


  getOTP() {
    var otp = Math.floor(1000 + Math.random() * 900000);
    return otp;
  },


  sendSms: (number, otp) => {
    sender.sendSms(`Your otp is ${otp}`, config.get('AWS.smsSecret'), false, number)
      .then(function (response) {
        return response;
      })
      .catch(function (err) {
        return err;
      })

  },

  /**
   * @param  {} text
   */
  encryptPass: (text) => {
    const salt = generateSalt(saltLength);
    const hash = md5(text + salt);
    return salt + hash;
  },

  getToken: async (payload) => {
    var token = await jwt.sign(payload, config.get('jwtsecret'), config.get('jwtOptions'))
    return token;
  },

  sendMail: async (to) => {


    let text = "Dear user you have been received an proposal on your order please verify."
    var transporter = nodemailer.createTransport({
      "host": process.env.AWS_SES_CONFIG_HOST,
      "port": process.env.AWS_SES_CONFIG_PORT,
      "secure": false,
      "auth": {
        "user": process.env.AWS_SES_CONFIG_AUTH_USER,
        "pass": process.env.AWS_SES_CONFIG_AUTH_PASS
      }
    });
    var mailOptions = {
      from: process.env.AWS_SES_FROM_MAIL,
      to: to,
      subject: 'New Proposal Received.',
      text: text
    };
    return await transporter.sendMail(mailOptions)
  },

  getImageUrl: async (files) => {
    let fileContent = fs.readFileSync(files[0].path);
    console.log("fileContent", fileContent)
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${files[0].originalname}`,
      Body: fileContent
    };
    let data = await s3.upload(params).promise();
    console.log("data", data);
    return data.Location;
  },

  getImgUrl: async (file) => {
    let fileContent = fs.readFileSync(file.path);
    console.log("fileContent", fileContent)
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${file.originalname}`,
      Body: fileContent
    };
    let data = await s3.upload(params).promise();
    console.log("data", data);
    return data.Location;
  },


  genBase64: async (data) => {
    return await qrcode.toDataURL(data);
  },

  s3BucketUploadFile: async (fileName, filekey) => {
    const fileContent = fs.readFileSync(fileName);
    console.log("fileContent", fileContent)
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${filekey}`,
      Body: fileContent
    };
    let data = await s3.upload(params).promise();
    console.log("data", data);
    //console.log(`File uploaded successfully. ${data.Location}`);
    return data.Location;
  },

  azureCloudUploadFile: async (file) => {
    const containerName = 'test-container2';
    const filePath = file.path;
    const blobName = file.originalname;

    const containerClient = await createContainer(containerName);
    // await setContainerAccessLevel(containerClient);
    await uploadFileAzure(containerClient, blobName, filePath);
    const resourceLink = `https://${accountName}.blob.core.windows.net/${containerName}/${file.originalname}`;
    console.log(`Resource link (URL): ${resourceLink}`);
  },

  getSecureUrl: async (base64) => {
    if (!base64.includes('https') && base64.match(/^data:image\/\w+;base64,/)) {
      let fileName = Date.now() + "_pic.png";
      const imageBuffer = Buffer.from(base64.split(',')[1], 'base64');
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${fileName}`,
        Body: imageBuffer,
        ContentEncoding: 'base64',
        ContentType: 'image/png'
      };
      let data = await s3.upload(params).promise();
      console.log("data", data);
      return data.Location;
    } else {
      return base64;
    }
  },


  getMobileUrl: async (files) => {
    console.log("90============", files)
    var result = await cloudinary.v2.uploader.upload(files)
    console.log("82", result)
    return result.secure_url;
  },

  sendEmailOtp: async (email, otp) => {
    let html
    let path = __dirname
    path = path.replace("/server/helper", "/template/emailOtp.html")

    let data = fs.readFileSync(path, { encoding: 'utf-8' })


    if (data) {
      data = data.replace('__NAME__', 'Admin')
      data = data.replace('__TXTMSG__', 'One Time Password(OTP)')
      data = data.replace('__OTP__', otp)
      html = data
    }

    var sub = `Use the One Time Password(OTP) ${otp} to verify your accoount.`
    let transporter = nodemailer.createTransport({
      "host": process.env.AWS_SES_CONFIG_HOST,
      "port": process.env.AWS_SES_CONFIG_PORT,
      "secure": false,
      "auth": {
        "user": process.env.AWS_SES_CONFIG_AUTH_USER,
        "pass": process.env.AWS_SES_CONFIG_AUTH_PASS
      }
    });
    var mailOptions = {
      from: process.env.AWS_SES_FROM_MAIL,
      to: email,
      subject: 'Otp for verication',
      html: html
    };
    return await transporter.sendMail(mailOptions)
  },


  retailerEmail: async (email, name, userType) => {
    var sub = `Dear ${userType} ${name}, Thank For Choosing us.\n\n Your Deatails has been saved our team will contact you.\n\n Thanks & Regards`
    let transporter = nodemailer.createTransport({
      "host": process.env.AWS_SES_CONFIG_HOST,
      "port": process.env.AWS_SES_CONFIG_PORT,
      "secure": false,
      "auth": {
        "user": process.env.AWS_SES_CONFIG_AUTH_USER,
        "pass": process.env.AWS_SES_CONFIG_AUTH_PASS
      }
    });
    var mailOptions = {
      from: process.env.AWS_SES_FROM_MAIL,
      to: email,
      subject: 'Registraions Details saved.',
      text: sub,
      // html: html
    };
    return await transporter.sendMail(mailOptions)
  },

  sendSmsTwilio: async (mobileNumber, otp) => {
    var result = await client.messages.create({
      body: `Your OTP is ${otp}`,
      to: mobileNumber,
      from: config.get('twilio.number')

    })
    console.log("136", result)
    return result;
  },

  uploadImage(image) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(image, function (error, result) {
        console.log(result);
        if (error) {
          reject(error);
        }
        else {
          resolve(result.url)
        }
      });
    })
  },

  makeReferral() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },


  partnerId() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return "RT-" + result;
  },

  ifId() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return "b_id-" + result;
  },

  genratePassword: () => {
    var password = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 10; i++) {
      password += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    // console.log(password);
    return password;
  },


  paginationFunction: (result, page, limit) => {
    let endIndex = page * limit;
    let startIndex = (page - 1) * limit;
    var resultArray = {}

    resultArray.page = page
    resultArray.limit = limit
    resultArray.remainingItems = result.length - endIndex

    if (result.length - endIndex < 0) {
      resultArray.remainingItems = 0

    }
    resultArray.count = result.length
    resultArray.results = result.slice(startIndex, endIndex)
    return resultArray
  },


  blockEmail: async (email, name) => {
    console.log("=================>", email)
    var sub = `Dear ${name}, Your account has been disabled due to violation our Terms & Conditions.\n\n Please contact to admin.\n\n Thanks & Regards\nTeam Digital Asset Store.`
    let transporter = nodemailer.createTransport({
      "host": process.env.AWS_SES_CONFIG_HOST,
      "port": process.env.AWS_SES_CONFIG_PORT,
      "secure": false,
      "auth": {
        "user": process.env.AWS_SES_CONFIG_AUTH_USER,
        "pass": process.env.AWS_SES_CONFIG_AUTH_PASS
      }
    });
    if (email != null) {
      var mailOptions = {
        from: process.env.AWS_SES_FROM_MAIL,
        to: email,
        subject: 'Account Blocked.',
        text: sub,
      };
      return await transporter.sendMail(mailOptions)
    } else {
      return { message: false }
    }

  },

  unblockEmail: async (email, name) => {
    var sub = `Dear ${name}, Your account is activated.\n\n If You have any query please contact to admin.\n\n Thanks & Regards\nTeam Digital Asset Store.`
    let transporter = nodemailer.createTransport({
      "host": process.env.AWS_SES_CONFIG_HOST,
      "port": process.env.AWS_SES_CONFIG_PORT,
      "secure": false,
      "auth": {
        "user": process.env.AWS_SES_CONFIG_AUTH_USER,
        "pass": process.env.AWS_SES_CONFIG_AUTH_PASS
      }
    });
    if (email != null) {
      var mailOptions = {
        from: process.env.AWS_SES_FROM_MAIL,
        to: email,
        subject: 'Account Activated.',
        text: sub,
      };
      return await transporter.sendMail(mailOptions)
    } else {
      return { message: false }
    }
  },

  makePageObject: async (query) => {
    let pageObject = { skip: 0, limit: 10 };
    if (query.page && query.limit) {
      const pageNo = parseInt(query.page);
      const pageSize = parseInt(query.limit);
      if (isFinite(pageNo) && isFinite(pageSize)) {
        const skip = (pageNo - 1) * pageSize;
        const limit = pageSize;
        pageObject.skip = skip;
        pageObject.limit = limit;
        return pageObject;
      }
    }
    return pageObject;
  },

  sendCredentialsByMail: async (name, message, email, subject) => {
    console.log("dsad", message, name)

    var transporter = nodemailer.createTransport({
      "host": process.env.AWS_SES_CONFIG_HOST,
      "port": process.env.AWS_SES_CONFIG_PORT,
      "secure": false,
      "auth": {
        "user": process.env.AWS_SES_CONFIG_AUTH_USER,
        "pass": process.env.AWS_SES_CONFIG_AUTH_PASS
      }
    });
    let m = `Dear ${name}`;
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
    table, th, td {
      border: 1px solid black;
      border-collapse: collapse;
    }
    </style>
    </head>
    <body>
    <div style="font-size:15px">
      ${message.replace('Hello', m)}
      <br>
        Thanks.<br>
        Best Regards,<br>
        Team Digital Asset Store 
        </p>
    </div>
    </body>
    </html>
    `
    var mailOptions = {
      from: process.env.AWS_SES_FROM_MAIL,
      to: email,
      subject: subject,
      html: html
    };
    return await transporter.sendMail(mailOptions)
  },

  // qrcodeGenerate: async (code) => {
  //   console.log("im here",code)
  //   return await QRCode.toDataURL(code.url)
  // }

  qrcodeGenerate: async (code) => {
    let data = await QRCode.toDataURL(code)
    console.log("317=-=-=-=-=-=-=-=-=--=-=-=-=-=-=-=-=-=", data)
    return data
  },

  uploadPdf: async (files) => {
    try {
      var result = await cloudinary.v2.uploader.upload(files, { resource_type: "image", type: "upload", content_type: "application/pdf" })
      return result;
    } catch (error) {
      throw error
    }



  },

  sendUsersMail: async (to, firstName, body, attribute, subject, id) => {
    console.log("555", id, attribute)

    let categ
    // // let info = await infocategory.findOne({user_id:id})
    // let info = await infocategory.findOne({where:{user_id:id}})
    // console.log("233",info)
    // let all="MANU"
    let includeArr = [
      {
        model: role
      }
    ]
    let userfind = await user.findOne({ where: { id: id }, include: includeArr })
    console.log("gdgdgdgdhgdhgdgdgdhgdhghdghghdghdghdghdgghdghgdhgdhgdgdgdhdddgdghdgdhgdhdghdhdhdghdhdhdhdhdghdghdg", userfind.dataValues);
    let dataMap = userfind.dataValues.role
    if (!dataMap) {
      dataMap = []
    }
    else {
      console.log("Live code -------------->>>live", userfind.dataValues.role)
      dataMap = userfind.dataValues.role.permissions.map(i => i.permission)
    }
    console.log("hgdfhfhgfhgfhghf", dataMap);
    // for (let index = 0; index < info.length; index++) {
    //   categ.push(info[index].dataValues.infoCategory)
    // }

    // console.log("dsad3",info.dataValues.infoCategory)
    if (!userfind || dataMap.length == 0) {
      categ = '';
    } else {
      for (let i = 0; i < dataMap.length; i++) {
        categ = dataMap[i]
      }
      console.log("408*/*/*/*/*/*/*/*/*/", categ);
      if ((categ.toUpperCase()).includes(("Manu").toUpperCase())) {
        categ = "ALL"
      }
    }
    //  console.log("vfvvv",attribute,"dssdd",nftAtrribute)
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
    table, th, td {
      border: 1px solid black;
      border-collapse: collapse;
    }
    </style>
    </head>
    <body>
    <div style="font-size:15px">
      <p>Hello ${firstName},</p>
      <p>This is an update for your subscribed event:- </p>
      <p> 
      ${body}.</p>

      <table style="width:100%">
        <tr>
          <th>Parameter Name</th>
          <th>Parameter Value</th>
          <th>Parameter Unit</th>
        </tr>
        ${attribute.length > 0 ? createMultiple(attribute, categ) : ''}       
      </table>

      
        Thanks.<br>
        Best Regards,<br>
        Team Digital Asset Store 
        </p>
    </div>
    </body>
    </html>
    `
    var transporter = nodemailer.createTransport({
      "host": process.env.AWS_SES_CONFIG_HOST,
      "port": process.env.AWS_SES_CONFIG_PORT,
      "secure": false,
      "auth": {
        "user": process.env.AWS_SES_CONFIG_AUTH_USER,
        "pass": process.env.AWS_SES_CONFIG_AUTH_PASS
      }
    });

    var mailOptions = {
      from: process.env.AWS_SES_FROM_MAIL,
      to: to,
      subject: subject,
      html: html
    };
    return await transporter.sendMail(mailOptions)
  },

  requestMail: async (body, subject, email) => {
    var transporter = nodemailer.createTransport({
      "host": process.env.AWS_SES_CONFIG_HOST,
      "port": process.env.AWS_SES_CONFIG_PORT,
      "secure": false,
      "auth": {
        "user": process.env.AWS_SES_CONFIG_AUTH_USER,
        "pass": process.env.AWS_SES_CONFIG_AUTH_PASS
      }
    });
    var mailOptions = {
      from: process.env.AWS_SES_FROM_MAIL,
      to: email,
      subject: subject,
      body: body
    };
    return await transporter.sendMail(mailOptions)
  },


}

function createMultiple(attribute, categ) {
  console.log("========?410", attribute, categ)
  let str = ``
  for (let i = 0; i < attribute.length; i++) {
    let categories
    console.log("====>", attribute[i].categoryInfo)
    if (attribute[i].categoryInfo != undefined) {
      categories = attribute[i].categoryInfo.split('-')[2]
    }
    if (categ == "ALL" || (categ.toUpperCase()).includes(categories) || attribute[i].categoryInfo == "" || attribute[i].categoryInfo == null || attribute[i].categoryInfo == undefined) {

      str = str + ` 
  <tr style="text-align:center">  
  <td style="jutify-content:center;">${attribute[i].keyInput}</td>
  <td style="jutify-content:center;">${attribute[i].valueInput}</td>
  <td style="jutify-content:center;">${attribute[i].unitInput}</td>
  </tr>`
    }
  }
  return str
}