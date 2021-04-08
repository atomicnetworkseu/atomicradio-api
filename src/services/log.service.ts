import moment from "moment";

export namespace LogService {
  export function logInfo(message: string) {
    console.info(` ${moment().format("DD/MM/YYYY HH:mm:ss")} | INFO | ${message}`);
  }

  export function logDebug(message: string) {
    console.debug(` ${moment().format("DD/MM/YYYY HH:mm:ss")} | DEBUG | ${message}`);
  }

  export function logWarn(message: string) {
    console.warn(` ${moment().format("DD/MM/YYYY HH:mm:ss")} | WARNING | ${message}`);
  }

  export function logError(message: string) {
    console.error(` ${moment().format("DD/MM/YYYY HH:mm:ss")} | ERROR | ${message}`);
  }
}
