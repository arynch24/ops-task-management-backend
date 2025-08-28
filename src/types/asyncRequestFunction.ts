import { Request, Response, NextFunction } from "express"

export type AsyncFunction = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void>;