import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User, type UserRole } from "../models/User";
import { env } from "../config/env";

interface JwtPayload {
    id: string;
}

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Not authorized, no token provided",
            });
            return;
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

        if (!decoded || typeof decoded.id !== "string") {
            res.status(401).json({
                success: false,
                message: "Not authorized, invalid token payload",
            });
            return;
        }

        if (mongoose.connection.readyState !== 1) {
            req.user = {
                _id: decoded.id || "64f1a2b3c4d5e6f7a8b9c0d1",
                id: decoded.id || "64f1a2b3c4d5e6f7a8b9c0d1",
                fullName: "Demo User",
                email: "demo@interviewiq.ai",
                role: "user",
                isEmailVerified: true,
                authProvider: "local",
            } as any;
            next();
            return;
        }

        try {
            const user = await User.findById(decoded.id);

            if (!user) {
                req.user = {
                    _id: decoded.id,
                    id: decoded.id,
                    fullName: "Demo User",
                    email: "demo@interviewiq.ai",
                    role: "user",
                    isEmailVerified: true,
                    authProvider: "local",
                } as any;
            } else {
                req.user = user;
            }
            next();
        } catch {
            req.user = {
                _id: decoded.id,
                id: decoded.id,
                fullName: "Demo User",
                email: "demo@interviewiq.ai",
                role: "user",
                isEmailVerified: true,
                authProvider: "local",
            } as any;
            next();
        }
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Not authorized, token failed",
        });
    }
};

export const authorize = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Not authorized",
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`,
            });
            return;
        }

        next();
    };
}; 