import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DATA_DIR = process.env.LICENSE_DATA_DIR ?? join(process.cwd(), 'data');
const DB_PATH = join(DATA_DIR, 'licenses.json');

type LicenseRecord = {
  id: string;
  keyHash: string;
  keyPreview: string;
  deviceId: string | null;
  status: 'active' | 'revoked';
  createdAt: string;
  activatedAt: string | null;
  note?: string;
};

type Db = { licenses: LicenseRecord[] };

const hashKey = (key: string): string => createHash('sha256').update(key.trim().toUpperCase()).digest('hex');

const ensureDb = () => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) writeFileSync(DB_PATH, JSON.stringify({ licenses: [] } as Db, null, 2));
};

const readDb = (): Db => {
  ensureDb();
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf8')) as Db;
  } catch {
    return { licenses: [] };
  }
};

const writeDb = (db: Db) => {
  ensureDb();
  const tmp = `${DB_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(db, null, 2));
  renameSync(tmp, DB_PATH);
};

const generateKey = (): string => {
  const raw = randomBytes(12).toString('hex').toUpperCase();
  return `ANM-${raw.match(/.{1,4}/g)?.join('-') ?? raw}`;
};

export const createLicenses = (count: number, note?: string): { key: string; id: string }[] => {
  const db = readDb();
  const created: { key: string; id: string }[] = [];
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

export const activateLicense = (key: string, deviceId: string): { ok: boolean; message: string } => {
  if (!key || !deviceId) return { ok: false, message: 'license and device are required' };
  const db = readDb();
  const rec = db.licenses.find((l) => l.keyHash === hashKey(key));
  if (!rec) return { ok: false, message: 'License not found' };
  if (rec.status !== 'active') return { ok: false, message: 'License is revoked' };
  if (rec.deviceId && rec.deviceId !== deviceId) return { ok: false, message: 'License already bound to another device' };
  if (!rec.deviceId) {
    rec.deviceId = deviceId;
    rec.activatedAt = new Date().toISOString();
    writeDb(db);
  }
  return { ok: true, message: 'Activated' };
};

export const isPremium = (key: string | undefined, deviceId: string | undefined): boolean => {
  if (!key || !deviceId) return false;
  const db = readDb();
  const rec = db.licenses.find((l) => l.keyHash === hashKey(key));
  if (!rec || rec.status !== 'active') return false;
  return rec.deviceId === deviceId;
};

export const listLicenses = (): Omit<LicenseRecord, 'keyHash'>[] =>
  readDb().licenses.map(({ keyHash, ...rest }) => rest);

export const revokeLicense = (id: string): boolean => {
  const db = readDb();
  const rec = db.licenses.find((l) => l.id === id);
  if (!rec) return false;
  rec.status = 'revoked';
  writeDb(db);
  return true;
};
