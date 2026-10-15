import {
  apiGet,
  apiPost,
} from './api';


/* =========================================
   DONOR SELF-SERVICE
========================================= */

export function getDonorProfile() {
  return apiGet(
    '/donors/profile.php'
  );
}


export function updateDonorProfile(data) {
  return apiPost(
    '/donors/update-profile.php',
    data
  );
}


export function updateDonorAvailability(
  available
) {
  return apiPost(
    '/donors/availability.php',
    {
      available_for_donation:
        available,
    }
  );
}


export function getDonorDonationHistory() {
  return apiGet(
    '/donors/donation-history.php'
  );
}


/* =========================================
   HOSPITAL / PERSONNEL DONOR MANAGEMENT
========================================= */

export function getHospitalDonors() {
  return apiGet(
    '/donors/hospital-list.php'
  );
}


export function updateHospitalDonor(data) {
  return apiPost(
    '/donors/hospital-update.php',
    data
  );
}


export function updateHospitalDonorAvailability(
  donorId,
  available
) {
  return apiPost(
    '/donors/hospital-availability.php',
    {
      donor_id: donorId,
      available_for_donation:
        available,
    }
  );
}


export function getHospitalDonorDonationHistory(
  donorId
) {
  return apiGet(
    `/donors/hospital-donation-history.php?donor_id=${encodeURIComponent(
      donorId
    )}`
  );
}