import { apiGet, apiPost } from './api';

export function getHospitalDonations() {
  return apiGet('/donations/hospital-list.php');
}

export function recordDonationFromAppointment(
  appointmentId,
  notes = ''
) {
  return apiPost(
    '/donations/record-from-appointment.php',
    {
      appointment_id: appointmentId,
      notes,
    }
  );
}

export function recordManualDonation(
  donorId,
  notes = ''
) {
  return apiPost(
    '/donations/record-manual.php',
    {
      donor_id: donorId,
      notes,
    }
  );
}