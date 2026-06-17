import { randomUUID } from "crypto"
import path from "node:path"


const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const allowedMimes = new Map<string, string[]> ([
    ["application/pdf", [".pdf"]],
    ["image/png", [".png"]],
    ["image/jpeg", [".jpg", ".jpeg"]],
    ["image/webp", [".webp"]],
    ["application/msword", [".doc"]],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", [".docx"]],
    ["application/vnd.ms-excel", [".xls"]],
    ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [".xlsx"]],
])

const LARGE_FILE_ERROR = 413
const WRONG_TYPE_ERROR = 400


export type UploadedFile = {
    name: string;
    type?: string;
    size?: number;
    arrayBuffer: () => Promise<ArrayBuffer>
}

export type ValidateUploadResult =
    | { ok: true; ext: string; safeName: string }
    | { ok: false; status: 400 | 413; error: string }



export function isUploadedFile(value: unknown): value is { name: string; type?: string; size?: number; arrayBuffer: () => Promise<ArrayBuffer> } {
        return !!value
            && typeof value === 'object'
            && 'name' in value
            && 'arrayBuffer' in value
            && typeof (value as { arrayBuffer?: unknown }).arrayBuffer === 'function';
    }

export function sanitizeFilename(value: string): string {
    return value
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160) || 'document';
}

function isAllowedExtension(ext: string): boolean {
    for (const extensions of allowedMimes.values()) {
        if (extensions.includes(ext)) return true;
    }
    return false;
}

export function validateUpload(file: UploadedFile): ValidateUploadResult {
    if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
        return { ok: false, status: LARGE_FILE_ERROR, error: 'File exceeds maximum upload size' };
    }

    const safeName = sanitizeFilename(file.name);
    const ext = path.extname(safeName).toLowerCase();
    if (!ext || !isAllowedExtension(ext)) {
        return { ok: false, status: WRONG_TYPE_ERROR, error: 'File extension is not allowed' };
    }

    const mime = file.type;
    if (!mime || !allowedMimes.has(mime)) {
        return { ok: false, status: WRONG_TYPE_ERROR, error: 'File type is not allowed' };
    }

    const extensionsForMime = allowedMimes.get(mime)!;
    if (!extensionsForMime.includes(ext)) {
        return { ok: false, status: WRONG_TYPE_ERROR, error: 'File type does not match extension' };
    }

    return { ok: true, ext, safeName };
}


export function buildStoredFilename(prefix: string, ext: string) {
    return `${prefix}-${randomUUID()}${ext}`
}

export type ValidBufferSize =
    | { ok: true }
    | { ok: false; status: 400 | 413; error: string }

export function assertBufferWithinLimit(buffer: ArrayBuffer): ValidBufferSize {
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
        return {ok: false, status: LARGE_FILE_ERROR, error: "File exceeds maximum upload size"}
    }
    return {ok: true}
}
