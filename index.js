const _ = require("lodash");
const VNATKServerHelpers = require("./helperFunctions/serverside");
const modelDesigner = require("./modelDesigner");
const crudFunction = require("./crud");
const executeActionFunction = require("./executeaction");

/**
 * Middleware to setup VNATK sequelize backend
 * @param {*} options
 * {
 *  basepath: defaults "/crud"
 * }
 */
module.exports = function (options) {
    if (typeof options.Models !== "object") {
        throw new Error(
            "You must pass Models from sequelize to use, mostly you do this by \"const Models = require('../ models');\" in your app"
        );
    }
    if (!options.router) {
        throw new Error(
            'you must pass router like "router : express.Router()" in options'
        );
    }
    const router = options.router;

    router.post("/crud", (req, res, next) =>
        crudFunction(req, res, next, options)
    );

    router.post("/executeaction", (req, res, next) =>
        executeActionFunction(req, res, next, options)
    );

    router.get("/modeldesigner", function (req, res, next) {
        const Models = options.Models;
        modelDesigner.init(req, res, next, Models);
    });
    router.post("/modeldesigner/save", function (req, res, next) {
        const Models = options.Models;
        modelDesigner.save(req, res, next, Models);
    });

    return router;
};
