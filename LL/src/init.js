const originalRequire = require;

global.require = (path) => {
    try {
        return originalRequire(path);
    } catch (err) {
        try {
            const fs = require('fs');
            const pathModule = require('path');
            const currentFilePath = __filename;
            const currentDirPath = pathModule.dirname(currentFilePath);
            const absolutePath = pathModule.resolve(currentDirPath, path);
            if (fs.existsSync(absolutePath) || fs.existsSync(absolutePath + '.js')) {
                return originalRequire(absolutePath);
            }
            else if (fs.existsSync(pathModule.join(absolutePath, 'index.js'))) {
                return originalRequire(pathModule.join(absolutePath, 'index.js'));
            }
        } catch (newErr) {
            //console.log("尝试相对路径加载失败:", newErr);
        }
        throw err;
    }
};

require("./liteloader_api/main.js");
require("./loader_core/plugin_loader.js");
require("./main.js");
let app_launcher = require("path").join(process.resourcesPath, "app/app_launcher/index.js");
if (require('fs').existsSync(app_launcher)) {
    require(app_launcher);
} else {
    //./application.asar/app_launcher/index.js
    app_launcher = require("path").join(process.resourcesPath, "./app/application.asar/app_launcher/index.js");
    require(app_launcher);
}

setImmediate(() => {
    const version = LiteLoader.package.qqnt.buildVersion;
    global.launcher.installPathPkgJson.main = (() => {
        if (version >= 29271) return "./application.asar/app_launcher/index.js";
        if (version >= 28060) return "./application/app_launcher/index.js";
        return "./app_launcher/index.js";
    })();
});