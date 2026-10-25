import { activateLicense, createLicenses, isPremium, listLicenses, revokeLicense } from '../src/license/store.js';
const adminKey = () => process.env.ADMIN_KEY ?? '';
const checkAdmin = (req) => adminKey() !== '' && req.header('x-admin-key') === adminKey();
const strings = (v) => {
    if (typeof v === 'string' && v.trim() !== '')
        return v.trim();
    return undefined;
};
export const activateHandler = (req, res) => {
    const license = strings(req.body?.license ?? req.query.license);
    const device = strings(req.body?.device ?? req.query.device);
    if (!license || !device)
        return res.status(400).json({ status: 'Error', message: 'license and device are required' });
    const result = activateLicense(license, device);
    if (!result.ok)
        return res.status(400).json({ status: 'Error', message: result.message });
    return res.status(200).json({ status: 'Ok', message: result.message, data: { premium: true } });
};
export const checkHandler = (req, res) => {
    const license = strings(req.query.license ?? req.body?.license);
    const device = strings(req.query.device ?? req.body?.device);
    return res.status(200).json({ status: 'Ok', data: { premium: isPremium(license, device) } });
};
export const generateHandler = (req, res) => {
    if (!checkAdmin(req))
        return res.status(401).json({ status: 'Error', message: 'Unauthorized' });
    const count = Math.min(Math.max(parseInt(String(req.body?.count ?? '1')) || 1, 1), 100);
    const note = strings(req.body?.note);
    return res.status(200).json({ status: 'Ok', data: createLicenses(count, note) });
};
export const listHandler = (req, res) => {
    if (!checkAdmin(req))
        return res.status(401).json({ status: 'Error', message: 'Unauthorized' });
    return res.status(200).json({ status: 'Ok', data: listLicenses() });
};
export const revokeHandler = (req, res) => {
    if (!checkAdmin(req))
        return res.status(401).json({ status: 'Error', message: 'Unauthorized' });
    const { id } = req.params;
    const ok = revokeLicense(id);
    if (!ok)
        return res.status(404).json({ status: 'Error', message: 'License not found' });
    return res.status(200).json({ status: 'Ok', message: 'Revoked' });
};
