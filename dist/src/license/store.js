import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const DATA_DIR = process.env.LICENSE_DATA_DIR ?? join(process.cwd(), 'data');
const DB_PATH = join(DATA_DIR, 'licenses.json');
const hashKey = (key) => createHash('sha256').update(key.trim().toUpperCase()).digest('hex');
const ensureDb = () => {
    if (!existsSync(DATA_DIR))
        mkdirSync(DATA_DIR, { recursive: true });
    if (!existsSync(DB_PATH))
        writeFileSync(DB_PATH, JSON.stringify({ licenses: [] }, null, 2));
};
const readDb = () => {
    ensureDb();
    try {
        return JSON.parse(readFileSync(DB_PATH, 'utf8'));
    }
    catch {
        return { licenses: [] };
    }
};
const writeDb = (db) => {
    ensureDb();
    const tmp = `${DB_PATH}.tmp`;
    writeFileSync(tmp, JSON.stringify(db, null, 2));
    renameSync(tmp, DB_PATH);
};
const generateKey = () => {
    const raw = randomBytes(12).toString('hex').toUpperCase();
    return `ANM-${raw.match(/.{1,4}/g)?.join('-') ?? raw}`;
};
export const createLicenses = (count, note) => {
    const db = readDb();
    const created = [];
    for (let i = 0; i < count; i++) {
        const key = generateKey();
        const id = `lic_${randomBytes(8).toString('hex')}`;
        db.licenses.push({
            id,
            keyHash: hashKey(key),
            keyPreview: `${key.slice(0, 8)}...${key.slice(-4)}`,
            deviceId: null,
            status: 'active',
            createdAt: new Date().toISOString(),
            activatedAt: null,
            note,
        });
        created.push({ key, id });
    }
    writeDb(db);
    return created;
};
export const activateLicense = (key, deviceId) => {
    if (!key || !deviceId)
        return { ok: false, message: 'license and device are required' };
    const db = readDb();
    const rec = db.licenses.find((l) => l.keyHash === hashKey(key));
    if (!rec)
        return { ok: false, message: 'License not found' };
    if (rec.status !== 'active')
        return { ok: false, message: 'License is revoked' };
    if (rec.deviceId && rec.deviceId !== deviceId)
        return { ok: false, message: 'License already bound to another device' };
    if (!rec.deviceId) {
        rec.deviceId = deviceId;
        rec.activatedAt = new Date().toISOString();
        writeDb(db);
    }
    return { ok: true, message: 'Activated' };
};
export const isPremium = (key, deviceId) => {
    if (!key || !deviceId)
        return false;
    const db = readDb();
    const rec = db.licenses.find((l) => l.keyHash === hashKey(key));
    if (!rec || rec.status !== 'active')
        return false;
    return rec.deviceId === deviceId;
};
export const listLicenses = () => readDb().licenses.map(({ keyHash, ...rest }) => rest);
export const revokeLicense = (id) => {
    const db = readDb();
    const rec = db.licenses.find((l) => l.id === id);
    if (!rec)
        return false;
    rec.status = 'revoked';
    writeDb(db);
    return true;
};
