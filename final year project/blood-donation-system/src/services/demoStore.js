const STORAGE_KEY = 'bloodSystemHospitalDemoV1';
const SESSION_KEY = 'bloodSystemPreviewSession';

export const PERSONNEL_RESPONSIBILITIES = Object.freeze({
  DONORS: 'Manage Donors',
  APPOINTMENTS: 'Manage Appointments',
  DONATIONS: 'Record Donations',
  INVENTORY: 'Manage Inventory',
  REQUESTS: 'Process Blood Requests',
  NOTIFICATIONS: 'Send Notifications',
});

export const DONATION_STATUSES = Object.freeze(['Pending', 'Approved', 'Completed', 'Incomplete']);

export const PREVIEW_HOSPITAL_ID = 'hospital-preview';

export class DemoDataError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'DemoDataError';
  }
}

function createInitialData() {
  return {
    hospitals: [
      {
        id: PREVIEW_HOSPITAL_ID,
        name: 'Evoltra Hospital',
        address: 'Sample address',
        state: 'Kaduna',
        city: 'Zaria',
        email: 'hospital@example.com',
        phone: '08000000000',
        contactName: 'Sample Contact',
        contactEmail: 'contact@example.com',
        status: 'Approved',
        adminName: 'Sample Hospital Admin',
        adminEmail: 'hospital-admin@example.com',
        isSample: true,
        createdAt: new Date().toISOString(),
      },
    ],
    personnel: [],
    donors: [],
    donations: [],
    appointments: [],
    bloodUnits: [],
    hospitalRequests: [],
    hospitalMessages: [],
    organisationNotices: [],
    seekers: [],
    feedback: [],
  };
}

export function readDemoData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const initialData = createInitialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }

  let data;

  try {
    data = JSON.parse(saved);
  } catch (error) {
    throw new DemoDataError(
      'Your saved frontend demo data is damaged and could not be read. The saved value has not been changed.',
      { cause: error }
    );
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray(data.hospitals) ||
    !Array.isArray(data.personnel)
  ) {
    throw new DemoDataError(
      'Your saved frontend demo data has an invalid structure. The saved value has not been changed.'
    );
  }

  return data;
}

function saveDemoData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('hospital-demo-updated'));
  return data;
}

export function updateHospitalDonor(hospitalId, donorId, changes, { allowSuspended = false } = {}) {
  if (!allowSuspended) requireOperationalHospital(hospitalId);
  const data = readDemoData();

  const donor = (data.donors || []).find(
    (item) => item.id === donorId && item.hospitalId === hospitalId
  );

  if (!donor) {
    throw new Error('Donor record not found at this hospital.');
  }

  if (typeof changes.available === 'boolean') {
    donor.available = changes.available;
  }

  const editableFields = [
    'fullName',
    'email',
    'phone',
    'gender',
    'dateOfBirth',
    'address',
  ];

  for (const field of editableFields) {
    if (field in changes) {
      const value = changes[field].trim();

      if (!value) {
        throw new Error('Complete all required profile fields.');
      }

      if (field === 'email') {
        const duplicate = (data.donors || []).some(
          (item) =>
            item.id !== donorId &&
            item.email.toLowerCase() === value.toLowerCase()
        );

        if (duplicate) {
          throw new Error('Another donor account uses this email.');
        }
      }

      if (field === 'dateOfBirth') {
        const birthDate = new Date(`${value}T00:00:00`);

        if (
          !isValidCalendarDate(value) ||
          Number.isNaN(birthDate.getTime()) ||
          birthDate > new Date()
        ) {
          throw new Error('Enter a valid date of birth.');
        }
      }

      donor[field] = field === 'email' ? value.toLowerCase() : value;
    }
  }

  donor.updatedAt = new Date().toISOString();
  saveDemoData(data);

  return donor;
}

export function getHospitalMessages(hospitalId, role, recipientId) {
  if (!recipientId) return [];

  return (readDemoData().hospitalMessages || [])
    .filter(
      (item) =>
        item.hospitalId === hospitalId &&
        item.recipientRole === role &&
        item.recipientId === recipientId
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markHospitalMessageRead(
  hospitalId,
  role,
  recipientId,
  messageId
) {
  const data = readDemoData();

  const message = (data.hospitalMessages || []).find(
    (item) =>
      item.id === messageId &&
      item.hospitalId === hospitalId &&
      item.recipientRole === role &&
      item.recipientId === recipientId
  );

  if (!message) {
    throw new Error('Message not found for this recipient.');
  }

  message.readAt = message.readAt || new Date().toISOString();
  saveDemoData(data);
}

export function sendHospitalPreviewMessage({
  hospitalId,
  purpose,
  subject,
  body,
  recipientRole,
  recipientIds,
  senderPersonnelId,
}) {
  const data = readDemoData();

  const hospital = data.hospitals.find(
    (item) => item.id === hospitalId && item.status === 'Approved'
  );

  if (!hospital) {
    throw new Error('An approved hospital is required.');
  }
  const senderPersonnel = senderPersonnelId
    ? (data.personnel || []).find((person) => person.id === senderPersonnelId && person.hospitalId === hospitalId && person.status === 'Active')
    : null;
  if (senderPersonnelId && !hasPersonnelResponsibility(senderPersonnel, PERSONNEL_RESPONSIBILITIES.NOTIFICATIONS)) {
    throw new Error('Send Notifications is not assigned to the selected personnel member.');
  }

  const allowedPurposes = {
    donor: [
      'Donation Invitation',
      'Appreciation',
      'Seasonal Greeting',
      'General Donor Announcement',
    ],
    personnel: ['Personnel Notice'],
  };

  if (!allowedPurposes[recipientRole]?.includes(purpose)) {
    throw new Error('Invalid message type for these recipients.');
  }

  if (!subject.trim() || !body.trim()) {
    throw new Error('Enter a subject and message.');
  }

  const candidates =
    recipientRole === 'donor'
      ? (data.donors || [])
      : data.personnel.filter((person) => person.status === 'Active');

  const validIds = candidates
    .filter((item) => item.hospitalId === hospitalId)
    .map((item) => item.id);

  const selectedIds = [...new Set(recipientIds)].filter(
    (id) => validIds.includes(id)
  );

  if (!selectedIds.length) {
    throw new Error('Select at least one valid recipient.');
  }

  const createdAt = new Date().toISOString();

  const messages = selectedIds.map((recipientId) => ({
    id: createId(),
    hospitalId,
    recipientRole,
    recipientId,
    purpose,
    subject: subject.trim(),
    body: body.trim(),
    createdAt,
    readAt: null,
    sender: senderPersonnel ? `${senderPersonnel.name} (personnel preview)` : 'Hospital staff preview',
  }));

  data.hospitalMessages = [
    ...(data.hospitalMessages || []),
    ...messages,
  ];

  saveDemoData(data);
  return messages.length;
}

export function subscribeToDemoChanges(callback) {
  window.addEventListener('hospital-demo-updated', callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener('hospital-demo-updated', callback);
    window.removeEventListener('storage', callback);
  };
}

export function getActiveHospitalPersonnel(hospitalId) {
  if (!hospitalId) return [];
  return (readDemoData().personnel || []).filter(
    (person) => person.hospitalId === hospitalId && person.status === 'Active'
  );
}

export function selectPreviewPersonnel(hospitalId, personnelId) {
  const person = getActiveHospitalPersonnel(hospitalId).find((item) => item.id === personnelId);
  if (!person) throw new Error('Select an active personnel member from this hospital.');
  sessionStorage.setItem(`previewPersonnel:${hospitalId}`, personnelId);
  window.dispatchEvent(new Event('preview-personnel-changed'));
  return person;
}

export function clearPreviewPersonnel(hospitalId) {
  if (hospitalId) sessionStorage.removeItem(`previewPersonnel:${hospitalId}`);
  window.dispatchEvent(new Event('preview-personnel-changed'));
}

export function getPreviewPersonnel(hospitalId) {
  if (!hospitalId) return null;
  const key = `previewPersonnel:${hospitalId}`;
  const selectedId = sessionStorage.getItem(key);
  if (!selectedId) return null;
  const person = (readDemoData().personnel || []).find(
    (item) => item.id === selectedId && item.hospitalId === hospitalId
  );
  if (!person || person.status !== 'Active') {
    sessionStorage.removeItem(key);
    return null;
  }
  return person;
}

export function hasPersonnelResponsibility(person, responsibility) {
  return Boolean(person?.status === 'Active' && (person.permissions || person.responsibilities || []).includes(responsibility));
}

export function getPersonnelResponsibilities(person) {
  return person?.permissions || person?.responsibilities || [];
}

export function isHospitalOperational(hospitalId) {
  return readDemoData().hospitals.some(
    (hospital) => hospital.id === hospitalId && hospital.status === 'Approved'
  );
}

function requireOperationalHospital(hospitalId) {
  if (!isHospitalOperational(hospitalId)) {
    throw new Error('This hospital is not active. Operational changes are blocked.');
  }
}
function createId() {
  return crypto.randomUUID();
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must contain at least 8 characters.');
  }
}

export function getPreviewSession() {
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearPreviewSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function authenticatePreviewAccount({ role, email, password }) {
  const data = readDemoData();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  let account;

  if (role === 'donor') {
    account = (data.donors || []).find(
      (item) => item.email === normalizedEmail && item.passwordHash === passwordHash
    );
  } else if (role === 'seeker') {
    account = (data.seekers || []).find(
      (item) => item.email === normalizedEmail && item.passwordHash === passwordHash
    );
  } else {
    throw new Error('Preview account login is only available for donors and seekers.');
  }

  if (!account) {
    throw new Error('The email or password is incorrect.');
  }

  const session = {
    role,
    accountId: account.id,
    hospitalId: account.hospitalId || null,
    signedInAt: new Date().toISOString(),
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  if (role === 'donor') {
    sessionStorage.setItem('previewHospitalId', account.hospitalId);
    sessionStorage.setItem(`previewDonor:${account.hospitalId}`, account.id);
  } else {
    sessionStorage.setItem('previewSeekerId', account.id);
  }

  return session;
}

function isValidCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
}

export function submitHospitalApplication(details) {
  const data = readDemoData();

  const requiredFields = [
    'name', 'address', 'state', 'city', 'email', 'phone',
    'contactName', 'contactEmail',
  ];
  if (requiredFields.some((field) => !details[field]?.trim())) {
    throw new Error('Complete all hospital application fields.');
  }

  const duplicate = data.hospitals.some(
    (hospital) =>
      hospital.email.toLowerCase() ===
      details.email.trim().toLowerCase()
  );

  if (duplicate) {
    throw new Error('A hospital record already uses this email.');
  }

  const createdAt = new Date().toISOString();
  data.hospitals.push({
    ...details,
    id: createId(),
    email: details.email.trim().toLowerCase(),
    status: 'Pending',
    adminName: '',
    adminEmail: '',
    participationHistory: [{ status: 'Pending', date: createdAt, reason: 'Application submitted' }],
    createdAt,
  });

  return saveDemoData(data);
}

export function registerHospitalDirectly(details) {
  const data = readDemoData();

  const requiredFields = [
    'name', 'address', 'state', 'city', 'email', 'phone',
    'contactName', 'contactEmail',
  ];
  if (requiredFields.some((field) => !details[field]?.trim())) {
    throw new Error('Complete all direct-registration fields.');
  }

  const duplicate = data.hospitals.some(
    (hospital) =>
      hospital.email.toLowerCase() ===
      details.email.trim().toLowerCase()
  );

  if (duplicate) {
    throw new Error('A hospital record already uses this email.');
  }

  data.hospitals.push({
    ...details,
    id: createId(),
    email: details.email.trim().toLowerCase(),
    status: 'Approved',
    participationHistory: [{
      status: 'Approved',
      date: new Date().toISOString(),
      reason: 'Registered directly by Organisation Admin',
    }],
    createdAt: new Date().toISOString(),
  });

  return saveDemoData(data);
}

export function reviewHospital(id, status, reason = '') {
  if (!['Approved', 'Rejected'].includes(status)) {
    throw new Error('Invalid review decision.');
  }

  const data = readDemoData();
  const hospital = data.hospitals.find((item) => item.id === id);

  if (!hospital || hospital.status !== 'Pending') {
    throw new Error('This application is no longer pending.');
  }

  if (status === 'Rejected' && !reason.trim()) {
    throw new Error('Enter a rejection reason.');
  }

  hospital.status = status;
  hospital.reviewedAt = new Date().toISOString();
  hospital.rejectionReason = status === 'Rejected' ? reason.trim() : '';
  hospital.participationHistory = [
    ...(hospital.participationHistory || []),
    {
      status,
      date: hospital.reviewedAt,
      reason: status === 'Rejected' ? hospital.rejectionReason : 'Application approved',
    },
  ];

  return saveDemoData(data);
}

export function assignHospitalAdmin(id, name, email) {
  const data = readDemoData();
  const hospital = data.hospitals.find((item) => item.id === id);

  if (!hospital || hospital.status !== 'Approved') {
    throw new Error('Approve the hospital before assigning its admin.');
  }

  if (!name.trim() || !email.trim()) {
    throw new Error('Enter the administrator’s name and email.');
  }

  hospital.adminName = name.trim();
  hospital.adminEmail = email.trim().toLowerCase();

  return saveDemoData(data);
}

export function updateHospitalDetails(hospitalId, details) {
  const data = readDemoData();
  const hospital = data.hospitals.find((item) => item.id === hospitalId);

  if (!hospital) throw new Error('Hospital record not found.');

  const fields = [
    'name', 'address', 'city', 'state', 'email', 'phone',
    'contactName', 'contactEmail',
  ];

  if (fields.some((field) => !details[field]?.trim())) {
    throw new Error('Complete all hospital contact fields.');
  }

  const email = details.email.trim().toLowerCase();
  const duplicate = data.hospitals.some(
    (item) => item.id !== hospitalId && item.email.toLowerCase() === email
  );

  if (duplicate) throw new Error('Another hospital already uses this email.');

  fields.forEach((field) => {
    hospital[field] = details[field].trim();
  });
  hospital.email = email;
  hospital.contactEmail = details.contactEmail.trim().toLowerCase();
  hospital.updatedAt = new Date().toISOString();
  return saveDemoData(data);
}

export function suspendHospital(hospitalId, reason) {
  const data = readDemoData();
  const hospital = data.hospitals.find((item) => item.id === hospitalId);

  if (!hospital || hospital.status !== 'Approved') {
    throw new Error('Only an approved hospital can be suspended.');
  }
  if (!reason.trim()) throw new Error('Enter a suspension reason.');

  const date = new Date().toISOString();
  hospital.status = 'Suspended';
  hospital.suspensionReason = reason.trim();
  hospital.suspendedAt = date;
  hospital.participationHistory = [
    ...(hospital.participationHistory || []),
    { status: 'Suspended', date, reason: hospital.suspensionReason },
  ];
  return saveDemoData(data);
}

export function reactivateHospital(hospitalId) {
  const data = readDemoData();
  const hospital = data.hospitals.find((item) => item.id === hospitalId);

  if (!hospital || hospital.status !== 'Suspended') {
    throw new Error('Only a suspended hospital can be reactivated.');
  }

  const date = new Date().toISOString();
  hospital.status = 'Approved';
  hospital.reactivatedAt = date;
  hospital.participationHistory = [
    ...(hospital.participationHistory || []),
    { status: 'Approved', date, reason: 'Hospital reactivated' },
  ];
  return saveDemoData(data);
}

export function addPersonnel(hospitalId, details) {
  const data = readDemoData();
  const hospital = data.hospitals.find(
    (item) => item.id === hospitalId
  );

  if (!hospital || hospital.status !== 'Approved') {
    throw new Error('An approved hospital is required.');
  }

  if (!details.permissions.length) {
    throw new Error('Select at least one responsibility.');
  }

  const duplicate = data.personnel.some(
    (person) =>
      person.hospitalId === hospitalId &&
      person.email.toLowerCase() === details.email.toLowerCase()
  );

  if (duplicate) {
    throw new Error('This email already belongs to your hospital’s staff.');
  }

  data.personnel.push({
    ...details,
    id: createId(),
    hospitalId,
    status: 'Active',
    createdAt: new Date().toISOString(),
  });

  return saveDemoData(data);
}

export function updatePersonnel(hospitalId, personnelId, details) {
  const data = readDemoData();

  const person = data.personnel.find(
    (item) =>
      item.id === personnelId &&
      item.hospitalId === hospitalId
  );

  if (!person) {
    throw new Error('Personnel record not found for this hospital.');
  }

  if (
    !details.name.trim() ||
    !details.email.trim() ||
    !details.phone.trim()
  ) {
    throw new Error('Complete the personnel contact details.');
  }

  if (!details.permissions.length) {
    throw new Error('Select at least one responsibility.');
  }

  const duplicate = data.personnel.some(
    (item) =>
      item.id !== personnelId &&
      item.hospitalId === hospitalId &&
      item.email.toLowerCase() ===
        details.email.trim().toLowerCase()
  );

  if (duplicate) {
    throw new Error(
      'This email already belongs to another staff member.'
    );
  }

  person.name = details.name.trim();
  person.email = details.email.trim().toLowerCase();
  person.phone = details.phone.trim();
  person.permissions = details.permissions;
  person.updatedAt = new Date().toISOString();

  return saveDemoData(data);
}
export function togglePersonnelStatus(hospitalId, personnelId) {
  const data = readDemoData();

  const person = data.personnel.find(
    (item) =>
      item.id === personnelId && item.hospitalId === hospitalId
  );

  if (!person) {
    throw new Error('Personnel record not found for this hospital.');
  }

  person.status = person.status === 'Active' ? 'Disabled' : 'Active';

  return saveDemoData(data);
}
export function getOrganisationNotices() {
  return readDemoData().organisationNotices || [];
}

export function saveOrganisationNotice({
  subject,
  message,
  hospitalIds,
}) {
  const data = readDemoData();

  const approvedIds = data.hospitals
    .filter((hospital) => hospital.status === 'Approved')
    .map((hospital) => hospital.id);

  const recipients = [...new Set(hospitalIds)].filter(
    (id) => approvedIds.includes(id)
  );

  if (!subject.trim() || !message.trim()) {
    throw new Error('Enter a subject and message.');
  }

  if (recipients.length === 0) {
    throw new Error('Select at least one approved hospital.');
  }

  const notice = {
    id: createId(),
    subject: subject.trim(),
    message: message.trim(),
    hospitalIds: recipients,
    createdAt: new Date().toISOString(),
    readByHospitalIds: [],
    status: 'Saved to local hospital inboxes',
  };

  data.organisationNotices = [
    notice,
    ...(data.organisationNotices || []),
  ];

  return saveDemoData(data);
}
export function getHospitalOrganisationNotices(hospitalId) {
  return (readDemoData().organisationNotices || [])
    .filter((notice) => notice.hospitalIds.includes(hospitalId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markOrganisationNoticeRead(noticeId, hospitalId) {
  const data = readDemoData();
  const notice = (data.organisationNotices || []).find(
    (item) => item.id === noticeId && item.hospitalIds.includes(hospitalId)
  );

  if (!notice) throw new Error('Hospital notice not found.');

  notice.readByHospitalIds = [
    ...new Set([...(notice.readByHospitalIds || []), hospitalId]),
  ];
  return saveDemoData(data);
}

export function saveFeedback(details) {
  const data = readDemoData();
  const fields = ['name', 'email', 'subject', 'message'];

  if (fields.some((field) => !details[field]?.trim())) {
    throw new Error('Complete all feedback fields.');
  }

  const feedback = {
    id: createId(),
    name: details.name.trim(),
    email: details.email.trim().toLowerCase(),
    subject: details.subject.trim(),
    message: details.message.trim(),
    reviewed: false,
    createdAt: new Date().toISOString(),
  };

  data.feedback = [feedback, ...(data.feedback || [])];
  saveDemoData(data);
  return feedback;
}

export function getFeedback() {
  return readDemoData().feedback || [];
}

export function toggleFeedbackReviewed(feedbackId) {
  const data = readDemoData();
  const feedback = (data.feedback || []).find((item) => item.id === feedbackId);

  if (!feedback) throw new Error('Feedback record not found.');

  feedback.reviewed = !feedback.reviewed;
  feedback.reviewedAt = feedback.reviewed ? new Date().toISOString() : null;
  return saveDemoData(data);
}

export function getHospitalDonors(hospitalId) {
  const data = readDemoData();

  return (data.donors || []).filter(
    (donor) => donor.hospitalId === hospitalId
  );
}

export function getHospitalDonations(hospitalId) {
  const data = readDemoData();

  return (data.donations || []).filter(
    (donation) => donation.hospitalId === hospitalId
  );
}

export async function addHospitalDonor(hospitalId, details) {
  const data = readDemoData();

  const hospital = data.hospitals.find(
    (item) => item.id === hospitalId && item.status === 'Approved'
  );

  if (!hospital) {
    throw new Error('An approved hospital is required.');
  }

  const requiredFields = [
    'fullName',
    'email',
    'phone',
    'gender',
    'dateOfBirth',
    'address',
    'bloodGroup',
    'genotype',
    'password',
  ];

  if (requiredFields.some((field) => !details[field]?.trim())) {
    throw new Error('Complete all required donor details.');
  }

  const birthDate = new Date(`${details.dateOfBirth}T00:00:00`);
  if (!isValidCalendarDate(details.dateOfBirth) || birthDate > new Date()) {
    throw new Error('Enter a valid date of birth.');
  }

  const donors = data.donors || [];

  const existingDonor = donors.find(
    (donor) => donor.email.toLowerCase() === details.email.trim().toLowerCase()
  );

  if (existingDonor?.passwordHash) {
    throw new Error('A donor account already uses this email.');
  }

  if (existingDonor && existingDonor.hospitalId !== hospitalId) {
    throw new Error('This donor record belongs to another hospital.');
  }

  validatePassword(details.password);
  const passwordHash = await hashPassword(details.password);
  const profile = { ...details };
  delete profile.password;

  if (existingDonor) {
    Object.assign(existingDonor, profile, {
      email: details.email.trim().toLowerCase(),
      passwordHash,
      updatedAt: new Date().toISOString(),
    });
    saveDemoData(data);
    return existingDonor;
  }

  const donor = {
    ...profile,
    id: createId(),
    hospitalId,
    email: details.email.trim().toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  data.donors = [...donors, donor];
  saveDemoData(data);

  return donor;
}

export function recordCompletedDonation({
  hospitalId,
  donorId,
  donationDate,
  reference,
  appointmentId = '',
  status = 'Completed',
}) {
  requireOperationalHospital(hospitalId);
  const data = readDemoData();
  const donations = data.donations || [];

  if (!DONATION_STATUSES.includes(status)) {
    throw new Error('Choose a valid donation status.');
  }

  // Repeating the same submission must not create another donation.
  const existing = donations.find(
    (donation) =>
      donation.hospitalId === hospitalId &&
      donation.reference === reference
  );

  if (existing) return existing;

  const donor = (data.donors || []).find(
    (item) => item.id === donorId && item.hospitalId === hospitalId
  );

  if (!donor) {
    throw new Error('Select a donor belonging to this hospital.');
  }

  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  if (!isValidCalendarDate(donationDate) || donationDate > localToday) {
    throw new Error('Choose a valid donation date that is not in the future.');
  }

  const appointment = appointmentId
    ? (data.appointments || []).find(
        (item) => item.id === appointmentId && item.hospitalId === hospitalId
      )
    : null;

  if (appointmentId && (
    !appointment ||
    appointment.donorId !== donorId ||
    appointment.date !== donationDate ||
    appointment.status !== 'Scheduled'
  )) {
    throw new Error('Select a scheduled appointment for this donor and donation date.');
  }

  if (appointment && status !== 'Completed') {
    throw new Error('A linked appointment can only be marked Completed.');
  }

  // Prevent accidental repeated recording for the same donor and date.
  const duplicate = donations.find(
    (item) =>
      item.hospitalId === hospitalId &&
      item.donorId === donorId &&
      item.donationDate === donationDate
  );

  if (duplicate) {
    if (appointment) {
      appointment.status = 'Completed';
      appointment.donationId = duplicate.id;
      appointment.updatedAt = new Date().toISOString();
      duplicate.appointmentId = duplicate.appointmentId || appointment.id;
      saveDemoData(data);
      return duplicate;
    }
    throw new Error('A donation is already recorded for this donor on this date.');
  }

  const donation = {
    id: createId(),
    reference: appointment ? `appointment:${appointment.id}` : reference,
    hospitalId,
    donorId,
    donorName: donor.fullName,
    bloodGroup: donor.bloodGroup,
    donationDate,
    status,
    recordedBy: 'Personnel preview',
    entryMethod: appointment || reference?.startsWith('appointment:') ? 'Completed from appointment' : 'Manual entry',
    appointmentId: appointment?.id || null,
    createdAt: new Date().toISOString(),
    statusHistory: [{ status, changedAt: new Date().toISOString(), changedBy: 'Personnel preview' }],
  };

  data.donations = [...donations, donation];
  if (appointment) {
    appointment.status = 'Completed';
    appointment.donationId = donation.id;
    appointment.updatedAt = new Date().toISOString();
  }
  saveDemoData(data);

  return donation;
}

export function updateHospitalDonationStatus({ hospitalId, donationId, nextStatus }) {
  requireOperationalHospital(hospitalId);
  if (!DONATION_STATUSES.includes(nextStatus)) throw new Error('Choose a valid donation status.');
  const data = readDemoData();
  const donation = (data.donations || []).find((item) => item.id === donationId && item.hospitalId === hospitalId);
  if (!donation) throw new Error('Donation record not found at this hospital.');
  if (donation.status === nextStatus) return donation;
  if (donation.status === 'Completed' && nextStatus !== 'Completed' && (data.bloodUnits || []).some((unit) => unit.hospitalId === hospitalId && unit.donationId === donationId)) {
    throw new Error('This completed donation already has an inventory unit and cannot be changed.');
  }
  donation.status = nextStatus;
  donation.updatedAt = new Date().toISOString();
  donation.statusHistory = [...(donation.statusHistory || []), { status: nextStatus, changedAt: donation.updatedAt, changedBy: 'Personnel preview' }];
  saveDemoData(data);
  return donation;
}

export function getPreviewDonor(hospitalId) {
  const donors = getHospitalDonors(hospitalId);
  const session = getPreviewSession();

  if (session?.role === 'donor') {
    return donors.find((donor) => donor.id === session.accountId) || null;
  }

  const selectedId = sessionStorage.getItem(
    `previewDonor:${hospitalId}`
  );

  return donors.find((donor) => donor.id === selectedId) || donors[0] || null;
}

export function getSignedInDonor() {
  const session = getPreviewSession();
  if (!session || session.role !== 'donor' || !session.accountId || !session.hospitalId) return null;
  return (readDemoData().donors || []).find(
    (donor) => donor.id === session.accountId && donor.hospitalId === session.hospitalId
  ) || null;
}

export function selectPreviewDonor(hospitalId, donorId) {
  const donor = getHospitalDonors(hospitalId).find(
    (item) => item.id === donorId
  );

  if (!donor) {
    throw new Error('Donor not found in this hospital.');
  }

  sessionStorage.setItem(`previewDonor:${hospitalId}`, donorId);
}
export function getPreviewHospitalId() {
  const session = getPreviewSession();
  if (session?.role === 'donor' && session.hospitalId) {
    return session.hospitalId;
  }

  const selectedId = sessionStorage.getItem('previewHospitalId');

  // Keep an explicit selection intact even if participation changes or the
  // record is later removed. Pages can then explain the situation rather than
  // silently showing another hospital's records.
  if (selectedId) return selectedId;

  const hospitals = readDemoData().hospitals.filter(
    (hospital) => hospital.status === 'Approved'
  );

  return hospitals[0]?.id || '';
}

export function setPreviewHospitalId(hospitalId) {
  const hospital = readDemoData().hospitals.find(
    (item) =>
      item.id === hospitalId &&
      item.status === 'Approved'
  );

  if (!hospital) {
    throw new Error('Select an approved hospital.');
  }

  sessionStorage.setItem('previewHospitalId', hospitalId);
}

export function getHospitalAppointments(hospitalId) {
  return (readDemoData().appointments || []).filter(
    (appointment) => appointment.hospitalId === hospitalId
  );
}

export function createDonationAppointment({
  hospitalId,
  donorId,
  date,
  time,
  note,
}) {
  const data = readDemoData();

  const hospital = data.hospitals.find(
    (item) =>
      item.id === hospitalId &&
      item.status === 'Approved'
  );

  if (!hospital) {
    throw new Error('Select an approved hospital.');
  }

  const donor = (data.donors || []).find(
    (item) =>
      item.id === donorId &&
      item.hospitalId === hospitalId
  );

  if (!donor) {
    throw new Error('Register a donor record at this hospital first.');
  }

  if (!isValidCalendarDate(date)) {
    throw new Error('Choose a valid appointment date.');
  }

  if (
    !/^\d{2}:\d{2}$/.test(time) ||
    time < '07:00' ||
    time > '22:00'
  ) {
    throw new Error('Appointment time must be between 7:00 AM and 10:00 PM.');
  }

  const appointmentTime = new Date(`${date}T${time}:00`);

  if (
    Number.isNaN(appointmentTime.getTime()) ||
    appointmentTime <= new Date()
  ) {
    throw new Error('Choose a future appointment date and time.');
  }

  const appointments = data.appointments || [];

  const duplicate = appointments.some(
    (item) =>
      item.hospitalId === hospitalId &&
      item.donorId === donorId &&
      item.date === date &&
      item.status !== 'Cancelled'
  );

  if (duplicate) {
    throw new Error('This donor already has an appointment on that date.');
  }

  const appointment = {
    id: createId(),
    hospitalId,
    donorId,
    donorName: donor.fullName,
    bloodGroup: donor.bloodGroup,
    phone: donor.phone,
    date,
    time,
    note: note.trim(),
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  };

  data.appointments = [...appointments, appointment];
  saveDemoData(data);

  return appointment;
}

export function cancelDonationAppointment(hospitalId, appointmentId) {
  requireOperationalHospital(hospitalId);
  const data = readDemoData();

  const appointment = (data.appointments || []).find(
    (item) =>
      item.id === appointmentId &&
      item.hospitalId === hospitalId
  );

  if (!appointment || appointment.status !== 'Scheduled') {
    throw new Error('Only scheduled appointments can be cancelled.');
  }

  appointment.status = 'Cancelled';
  appointment.updatedAt = new Date().toISOString();

  return saveDemoData(data);
}

export function cancelOwnDonationAppointment({ hospitalId, donorId, appointmentId }) {
  const data = readDemoData();
  const appointment = (data.appointments || []).find(
    (item) => item.id === appointmentId && item.hospitalId === hospitalId && item.donorId === donorId
  );
  if (!appointment) throw new Error('This appointment does not belong to your donor account.');
  if (appointment.status !== 'Scheduled') throw new Error('Only scheduled appointments can be cancelled.');
  const appointmentTime = new Date(`${appointment.date}T${appointment.time}:00`);
  if (Number.isNaN(appointmentTime.getTime()) || appointmentTime <= new Date()) {
    throw new Error('Only future scheduled appointments can be cancelled.');
  }
  appointment.status = 'Cancelled';
  appointment.updatedAt = new Date().toISOString();
  appointment.cancelledBy = 'Donor preview';
  return saveDemoData(data);
}

export function completeDonationAppointment(hospitalId, appointmentId) {
  requireOperationalHospital(hospitalId);
  const data = readDemoData();

  const appointment = (data.appointments || []).find(
    (item) =>
      item.id === appointmentId &&
      item.hospitalId === hospitalId
  );

  if (!appointment) {
    throw new Error('Appointment not found at this hospital.');
  }

  if (appointment.status === 'Completed') {
    return data;
  }

  if (appointment.status !== 'Scheduled') {
    throw new Error('This appointment cannot be completed.');
  }

  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  const scheduledTime = new Date(
    `${appointment.date}T${appointment.time}:00`
  );

  if (appointment.date !== today || scheduledTime > now) {
    throw new Error(
      'Complete an appointment on its booked date, at or after its booked time. Use the Completed Donations form for other past donations.'
    );
  }

  const donation = recordCompletedDonation({
    hospitalId,
    donorId: appointment.donorId,
    donationDate: today,
    reference: `appointment:${appointment.id}`,
  });

  // Read again so the newly saved donation is preserved.
  const updatedData = readDemoData();

  const updatedAppointment = updatedData.appointments.find(
    (item) =>
      item.id === appointmentId &&
      item.hospitalId === hospitalId
  );

  updatedAppointment.status = 'Completed';
  updatedAppointment.donationId = donation.id;
  updatedAppointment.updatedAt = new Date().toISOString();

  return saveDemoData(updatedData);
}
export function getLocalDateString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function effectiveBloodUnitStatus(unit) {
  const canExpire = [
    'Awaiting Screening',
    'Available',
    'Reserved',
  ].includes(unit.status);

  if (canExpire && unit.expiryDate < getLocalDateString()) {
    return 'Expired';
  }

  return unit.status;
}

export function getHospitalBloodUnits(hospitalId) {
  return (readDemoData().bloodUnits || [])
    .filter((unit) => unit.hospitalId === hospitalId)
    .map((unit) => ({
      ...unit,
      status: effectiveBloodUnitStatus(unit),
    }));
}

export function addHospitalBloodUnit({
  hospitalId,
  donationId,
  expiryDate,
}) {
  const data = readDemoData();

  const hospital = data.hospitals.find(
    (item) => item.id === hospitalId && item.status === 'Approved'
  );

  if (!hospital) {
    throw new Error('An approved hospital is required.');
  }

  const donation = (data.donations || []).find(
    (item) =>
      item.id === donationId &&
      item.hospitalId === hospitalId &&
      item.status === 'Completed'
  );

  if (!donation) {
    throw new Error('Select a completed donation at this hospital.');
  }

  const parsedExpiry = new Date(`${expiryDate}T00:00:00`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate) ||
    Number.isNaN(parsedExpiry.getTime()) ||
    expiryDate < donation.donationDate
  ) {
    throw new Error('Expiry date must not be before the collection date.');
  }

  const units = data.bloodUnits || [];

  // This preview records one blood unit from each completed donation.
  const duplicate = units.some(
    (unit) =>
      unit.hospitalId === hospitalId &&
      unit.donationId === donationId
  );

  if (duplicate) {
    throw new Error('This donation already has a blood unit recorded.');
  }

  const unit = {
    id: createId(),
    unitCode: `BU-${createId().toUpperCase()}`,
    hospitalId,
    donationId,
    donorId: donation.donorId,
    donorName: donation.donorName,
    bloodGroup: donation.bloodGroup,
    collectionDate: donation.donationDate,
    expiryDate,
    status: 'Awaiting Screening',
    createdAt: new Date().toISOString(),
    history: [
      {
        status: 'Awaiting Screening',
        note: 'Unit recorded in frontend preview.',
        changedAt: new Date().toISOString(),
      },
    ],
  };

  data.bloodUnits = [...units, unit];
  saveDemoData(data);

  return unit;
}

export function changeHospitalBloodUnitStatus({
  hospitalId,
  unitId,
  nextStatus,
  note,
  releaseConfirmed = false,
}) {
  requireOperationalHospital(hospitalId);
  const data = readDemoData();

  const unit = (data.bloodUnits || []).find(
    (item) =>
      item.id === unitId &&
      item.hospitalId === hospitalId
  );

  if (!unit) {
    throw new Error('Blood unit not found at this hospital.');
  }

  const currentStatus = effectiveBloodUnitStatus(unit);

  if (nextStatus === 'Available') {
    if (currentStatus !== 'Awaiting Screening') {
      throw new Error('Only units awaiting screening can be released here.');
    }

    if (!releaseConfirmed) {
      throw new Error('Confirm the authorised release decision.');
    }
  } else if (nextStatus === 'Discarded') {
    if (
      !['Awaiting Screening', 'Available', 'Expired'].includes(currentStatus)
    ) {
      throw new Error('This unit cannot be discarded through this action.');
    }

    if (!note.trim()) {
      throw new Error('Enter a reason for discarding this unit.');
    }
  } else {
    throw new Error('This status change is not supported here.');
  }

  unit.status = nextStatus;
  unit.updatedAt = new Date().toISOString();

  unit.history = [
    ...(unit.history || []),
    {
      previousStatus: currentStatus,
      status: nextStatus,
      note: note.trim(),
      changedAt: new Date().toISOString(),
      changedBy: 'Personnel preview',
    },
  ];

  saveDemoData(data);
}

export function getPublicBloodAvailability(bloodGroup) {
  const approvedHospitals = readDemoData().hospitals.filter(
    (hospital) => hospital.status === 'Approved'
  );

  return approvedHospitals.map((hospital) => {
    const available = getHospitalBloodUnits(hospital.id).some(
      (unit) =>
        unit.bloodGroup === bloodGroup &&
        unit.status === 'Available'
    );

    return {
      id: hospital.id,
      name: hospital.name,
      city: hospital.city,
      state: hospital.state,
      available,
    };
  });
}
export function getPreviewSeekers() {
  return readDemoData().seekers || [];
}

export function getPreviewSeeker() {
  const seekers = getPreviewSeekers();
  const session = getPreviewSession();

  if (session?.role === 'seeker') {
    return seekers.find((item) => item.id === session.accountId) || null;
  }

  const selectedId = sessionStorage.getItem('previewSeekerId');

  return seekers.find((item) => item.id === selectedId) || seekers[0] || null;
}

export function selectPreviewSeeker(seekerId) {
  if (!getPreviewSeekers().some((item) => item.id === seekerId)) {
    throw new Error('Seeker record not found.');
  }

  sessionStorage.setItem('previewSeekerId', seekerId);
}

export async function addPreviewSeeker(details) {
  const data = readDemoData();
  const seekers = data.seekers || [];

  if (!details.fullName.trim() || !details.email.trim() || !details.phone.trim()) {
    throw new Error('Complete all seeker details.');
  }

  validatePassword(details.password);

  const email = details.email.trim().toLowerCase();

  const existingSeeker = seekers.find((item) => item.email === email);

  if (existingSeeker?.passwordHash) {
    throw new Error('A seeker account already uses this email.');
  }

  const passwordHash = await hashPassword(details.password);

  if (existingSeeker) {
    Object.assign(existingSeeker, {
      fullName: details.fullName.trim(),
      email,
      phone: details.phone.trim(),
      passwordHash,
      updatedAt: new Date().toISOString(),
    });
    saveDemoData(data);
    return existingSeeker;
  }

  const seeker = {
    id: createId(),
    fullName: details.fullName.trim(),
    email,
    phone: details.phone.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  data.seekers = [...seekers, seeker];
  saveDemoData(data);

  return seeker;
}

export function getSeekerRequests(seekerId) {
  return (readDemoData().hospitalRequests || []).filter(
    (request) => request.seekerId === seekerId
  );
}

export function getHospitalRequests(hospitalId) {
  return (readDemoData().hospitalRequests || []).filter(
    (request) => request.hospitalId === hospitalId
  );
}

function addRequestProgress(data, request, status, note) {
  const createdAt = new Date().toISOString();

  request.status = status;
  request.updatedAt = createdAt;

  request.history = [
    ...(request.history || []),
    { status, note, createdAt },
  ];

  data.hospitalMessages = [
    ...(data.hospitalMessages || []),
    {
      id: createId(),
      hospitalId: request.hospitalId,
      recipientRole: 'seeker',
      recipientId: request.seekerId,
      requestId: request.id,
      purpose: 'Request Progress',
      subject: `${request.trackingNumber}: ${status}`,
      body: note,
      createdAt,
      readAt: null,
      sender: 'Hospital request preview',
    },
  ];
}

export function createHospitalRequest(details) {
  const data = readDemoData();

  const seeker = (data.seekers || []).find(
    (item) => item.id === details.seekerId
  );

  const hospital = data.hospitals.find(
    (item) =>
      item.id === details.hospitalId &&
      item.status === 'Approved'
  );

  if (!seeker || !hospital) {
    throw new Error('Select a seeker and an approved hospital.');
  }

  const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  if (!groups.includes(details.bloodGroup)) {
    throw new Error('Select a valid blood group.');
  }

  const quantity = Number(details.quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Enter a whole number of units greater than zero.');
  }

  if (
    !details.patientName.trim() ||
    !['Routine', 'Urgent'].includes(details.urgency)
  ) {
    throw new Error('Complete the patient name and urgency.');
  }

  const requests = data.hospitalRequests || [];

  if (requests.some((item) => item.submissionId === details.submissionId)) {
    throw new Error('This submission has already been saved.');
  }

  let trackingNumber;

  do {
    trackingNumber = `BR-${createId().toUpperCase()}`;
  } while (
    requests.some((item) => item.trackingNumber === trackingNumber)
  );

  const request = {
    ...details,
    id: createId(),
    patientName: details.patientName.trim(),
    note: details.note.trim(),
    quantity,
    trackingNumber,
    seekerName: seeker.fullName,
    hospitalName: hospital.name,
    allocatedUnitIds: [],
    createdAt: new Date().toISOString(),
    history: [],
  };

  addRequestProgress(
    data,
    request,
    'Submitted',
    'Your blood request has been received and is awaiting review.'
  );

  data.hospitalRequests = [...requests, request];
  saveDemoData(data);

  return request;
}

export function updateHospitalRequest({
  hospitalId,
  requestId,
  nextStatus,
  note,
  unitIds = [],
}) {
  requireOperationalHospital(hospitalId);
  const data = readDemoData();

  const request = (data.hospitalRequests || []).find(
    (item) =>
      item.id === requestId &&
      item.hospitalId === hospitalId
  );

  if (!request) {
    throw new Error('Request not found at this hospital.');
  }

  const allowedChanges = {
    Submitted: ['Under Review', 'Rejected', 'Cancelled'],
    'Under Review': ['Approved', 'Rejected', 'Cancelled'],
    Approved: ['Ready for Collection', 'Cancelled'],
    'Ready for Collection': ['Completed', 'Cancelled'],
  };

  if (!allowedChanges[request.status]?.includes(nextStatus)) {
    throw new Error('This request cannot move to that status.');
  }

  if (!note.trim()) {
    throw new Error('Enter a progress message for the seeker.');
  }

  const units = data.bloodUnits || [];

  if (nextStatus === 'Approved') {
    const uniqueIds = [...new Set(unitIds)];

    if (uniqueIds.length !== request.quantity) {
      throw new Error(
        `Select exactly ${request.quantity} available unit(s).`
      );
    }

    const selectedUnits = uniqueIds.map((id) =>
      units.find((unit) => unit.id === id)
    );

    const invalid = selectedUnits.some(
      (unit) =>
        !unit ||
        unit.hospitalId !== hospitalId ||
        unit.bloodGroup !== request.bloodGroup ||
        effectiveBloodUnitStatus(unit) !== 'Available' ||
        unit.requestId
    );

    if (invalid) {
      throw new Error('One or more selected units are no longer available.');
    }

    selectedUnits.forEach((unit) => {
      unit.status = 'Reserved';
      unit.requestId = request.id;
      unit.history = [
        ...(unit.history || []),
        {
          status: 'Reserved',
          requestId: request.id,
          changedAt: new Date().toISOString(),
        },
      ];
    });

    request.allocatedUnitIds = uniqueIds;
  }

  if (['Ready for Collection', 'Completed'].includes(nextStatus)) {
    const allocated = request.allocatedUnitIds.map((id) =>
      units.find((unit) => unit.id === id)
    );

    if (
      allocated.length !== request.quantity ||
      allocated.some(
        (unit) =>
          !unit ||
          unit.hospitalId !== hospitalId ||
          unit.requestId !== request.id ||
          effectiveBloodUnitStatus(unit) !== 'Reserved'
      )
    ) {
      throw new Error(
        'The reserved units are no longer valid. Cancel this request to release its reservation before arranging a replacement request.'
      );
    }

    if (nextStatus === 'Completed') {
      allocated.forEach((unit) => {
        unit.status = 'Issued';
        unit.history = [
          ...(unit.history || []),
          {
            status: 'Issued',
            requestId: request.id,
            changedAt: new Date().toISOString(),
          },
        ];
      });
    }
  }

  if (nextStatus === 'Cancelled') {
    units
      .filter(
        (unit) =>
          unit.hospitalId === hospitalId &&
          unit.requestId === request.id &&
          unit.status === 'Reserved'
      )
      .forEach((unit) => {
        unit.status =
          unit.expiryDate < getLocalDateString() ? 'Expired' : 'Available';

        unit.history = [
          ...(unit.history || []),
          {
            status: unit.status,
            note: 'Request cancelled; reservation removed.',
            changedAt: new Date().toISOString(),
          },
        ];

        unit.requestId = null;
      });
  }

  addRequestProgress(data, request, nextStatus, note.trim());
  saveDemoData(data);
}

export function getSeekerMessages(seekerId) {
  if (!seekerId) return [];

  return (readDemoData().hospitalMessages || [])
    .filter(
      (message) =>
        message.recipientRole === 'seeker' &&
        message.recipientId === seekerId
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
