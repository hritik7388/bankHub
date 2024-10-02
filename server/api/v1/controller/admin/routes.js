import Express from "express";
import controller from "./controller"; 


export default Express.Router()


    .post('/adminLogin', controller.adminLogin)

