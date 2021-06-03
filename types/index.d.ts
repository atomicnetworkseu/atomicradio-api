declare module "express-prometheus-middleware";
declare module "flakeid";
declare namespace Express {
  export interface Request {
    requestIp?: string,
  }
}