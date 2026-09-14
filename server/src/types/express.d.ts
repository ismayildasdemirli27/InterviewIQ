import type { IUser } from "../models/User";
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser;
  }
}

declare module "express" {
  export interface Request {
    user?: IUser;
  }
}

declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
  }
}

export {};