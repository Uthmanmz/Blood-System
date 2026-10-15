import assert from 'node:assert/strict';

class MemoryStorage {
  #values = new Map();

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }

  clear() {
    this.#values.clear();
  }
}

globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();
globalThis.window = new EventTarget();

const store = await import('../src/services/demoStore.js');
const hospitalId = store.PREVIEW_HOSPITAL_ID;

const expectFailure = async (operation, messagePattern) => {
  await assert.rejects(operation, messagePattern);
};

assert.equal(store.readDemoData().hospitals.length, 1, 'initial hospital exists');

await expectFailure(
  () => store.addHospitalDonor(hospitalId, {
    fullName: 'Short Password Donor',
    email: 'short@example.com',
    phone: '08010000000',
    dateOfBirth: '1990-01-01',
    gender: 'Female',
    bloodGroup: 'O+',
    genotype: 'AA',
    address: 'Test address',
    available: true,
    password: 'short',
  }),
  /at least 8 characters/
);

const donor = await store.addHospitalDonor(hospitalId, {
  fullName: 'Verified Donor',
  email: 'donor@example.com',
  phone: '08010000001',
  dateOfBirth: '1990-01-01',
  gender: 'Female',
  bloodGroup: 'O+',
  genotype: 'AA',
  address: 'Test address',
  available: true,
  password: 'DonorPass123',
});

assert.ok(donor.passwordHash, 'donor password hash is saved');
assert.equal('password' in donor, false, 'donor plaintext password is not saved');

await expectFailure(
  () => store.authenticatePreviewAccount({
    role: 'donor',
    email: donor.email,
    password: 'WrongPass123',
  }),
  /incorrect/
);

const donorSession = await store.authenticatePreviewAccount({
  role: 'donor',
  email: 'DONOR@EXAMPLE.COM',
  password: 'DonorPass123',
});

assert.equal(donorSession.accountId, donor.id, 'donor login resolves the account');
assert.equal(store.getPreviewDonor(hospitalId).id, donor.id, 'donor session is isolated');
assert.equal(store.getPreviewHospitalId(), hospitalId, 'donor hospital context is fixed');

const today = store.getLocalDateString();
const expiry = `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`;
const donation = store.recordCompletedDonation({
  hospitalId,
  donorId: donor.id,
  donationDate: today,
  reference: 'verification-donation',
});

const unit = store.addHospitalBloodUnit({
  hospitalId,
  donationId: donation.id,
  expiryDate: expiry,
});

store.changeHospitalBloodUnitStatus({
  hospitalId,
  unitId: unit.id,
  nextStatus: 'Available',
  note: 'Verified screening release.',
  releaseConfirmed: true,
});

store.clearPreviewSession();
assert.equal(store.getPreviewSession(), null, 'logout clears the session');

const seeker = await store.addPreviewSeeker({
  fullName: 'Verified Seeker',
  email: 'seeker@example.com',
  phone: '08020000001',
  password: 'SeekerPass123',
});

assert.ok(seeker.passwordHash, 'seeker password hash is saved');
assert.equal('password' in seeker, false, 'seeker plaintext password is not saved');

const seekerSession = await store.authenticatePreviewAccount({
  role: 'seeker',
  email: seeker.email,
  password: 'SeekerPass123',
});

assert.equal(seekerSession.accountId, seeker.id, 'seeker login resolves the account');
assert.equal(store.getPreviewSeeker().id, seeker.id, 'seeker session is isolated');

const request = store.createHospitalRequest({
  seekerId: seeker.id,
  hospitalId,
  patientName: 'Verified Patient',
  bloodGroup: 'O+',
  quantity: '1',
  urgency: 'Urgent',
  note: 'Verification request',
  submissionId: 'verification-request',
});

assert.equal(request.status, 'Submitted', 'request starts as submitted');
store.updateHospitalRequest({
  hospitalId,
  requestId: request.id,
  nextStatus: 'Under Review',
  note: 'Request reviewed.',
});
store.updateHospitalRequest({
  hospitalId,
  requestId: request.id,
  nextStatus: 'Approved',
  note: 'Request approved.',
  unitIds: [unit.id],
});
store.updateHospitalRequest({
  hospitalId,
  requestId: request.id,
  nextStatus: 'Ready for Collection',
  note: 'Ready for collection.',
});
store.updateHospitalRequest({
  hospitalId,
  requestId: request.id,
  nextStatus: 'Completed',
  note: 'Collection completed.',
});

assert.equal(
  store.getHospitalRequests(hospitalId)[0].status,
  'Completed',
  'request completes through the full status workflow'
);
assert.equal(
  store.getHospitalBloodUnits(hospitalId)[0].status,
  'Issued',
  'allocated unit is issued when the request completes'
);
assert.equal(
  store.getSeekerMessages(seeker.id).length,
  5,
  'each request status creates a seeker progress message'
);

console.log('Demo-store verification passed: accounts, sessions, donation, inventory, request allocation, completion, and notifications.');
