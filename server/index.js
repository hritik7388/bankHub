import Config from "config";
import Routes from "./routes";
import Server from "./common/server";
const server = new Server()
    .router(Routes)
    .configureSwagger(Config.get("swaggerDefinition"))
    .handleError()
    .configureDb()
    .then((_server) => _server.listen(Config.get("port")));

export default server;
