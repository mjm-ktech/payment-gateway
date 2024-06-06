const util = require('util');
export function debug(object) {
  strapi.log.info("--------DEBUG--------");
  strapi.log.info(`data: ${util.inspect(object, { showHidden: false, depth: null })}`);
  strapi.log.info("--------END--------");
 }
