import admin from './api/v1/controller/admin/routes';
//import user from './api/v1/controllers/user/routes'
/**
 *
 *
 * @export
 * @param {any} app
 */

export default function routes(app) {


    app.use('/api/v1/admin', admin)
    //app.use('/api/v1/user', user)
    return app;
    }
