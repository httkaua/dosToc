import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

// TS TYPE CB
type DestinationCallback = (error: Error | null, destination: string) => void;

// TS TYPE FILENAME
type FilenameCallback = (error: Error | null, filename: string) => void;

const storage = multer.diskStorage({
    destination: function (
        req: Request,
        file: Express.Multer.File,
        cb: DestinationCallback
    ) {
        cb(null, "./uploads");
    },
    filename: function (
        req: Request,
        file: Express.Multer.File,
        cb: DestinationCallback
    ) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// filter to validate only images
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Tipo de arquivo não permitido.") as any, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // limit image size
});

export default upload
