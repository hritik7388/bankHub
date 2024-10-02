import express from "express";
import * as http from "http";
import * as path from "path";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc"; 
import apiErrorHandler from '../helper/apiErrorHandler';
import db from '../database'

//*******************************ends block of cron********************************/
const app = new express();
var server = http.createServer(app);
import socket from 'socket.io';
const io = socket(server, {
    pingInterval: 1000 * 60 * 5,
    pingTimeout: 1000 * 60 * 3
})

const root = path.normalize(`${__dirname}/../..`);
class ExpressServer {
    constructor() {
        app.use(express.json({
            limit: '1000mb'
        }));
        app.use(express.urlencoded({
            extended: true,
            limit: '1000mb'
        }))

        app.use(morgan('dev'))

        app.use(
            cors({
                allowedHeaders: ["Content-Type", "token", "authorization"],
                exposedHeaders: ["token", "authorization"],
                origin: "*",
                methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
                preflightContinue: false,
            })
        );
    }
    router(routes) {
        routes(app);
        return this;
    }

    configureSwagger(swaggerDefinition) {
        const options = {
            swaggerDefinition,
            apis: [
                path.resolve(`${root}/server/api/v1/controllers/**/*.js`),
                path.resolve(`${root}/api.yaml`),
            ],
        };

        app.use(
            "/api-docs",
            swaggerUi.serve,
            swaggerUi.setup(swaggerJSDoc(options))
        );
        return this;
    }

    handleError() {
        app.use(apiErrorHandler);

        return this;
    }


    configureDb() {
        return new Promise((resolve, reject) => {
            console.log(db.sequelize.sync, "db.sequelize")
            db.sequelize.sync({
                alter: true
            }).then(() => {
                console.log(`Database & tables generated!`);
                return resolve(this);
            }).catch((err) => {
                return reject(err);
            });
        });
    }

    listen(port) {
        server.listen(port, () => {
            console.log(`secure app is listening @port ${port}`, new Date().toLocaleString());
        });
        return app;
    }
}


export default ExpressServer;
