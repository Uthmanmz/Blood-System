import {
  apiGet,
  apiPost,
} from './api';


export function getOrganisationAnalytics() {
  return apiGet(
    '/organisation/analytics.php'
  );
}


export function getOrganisationHospitals() {
  return apiGet(
    '/hospitals/list.php'
  );
}


export function createOrganisationNotice(data) {
  return apiPost(
    '/organisation/create-notice.php',
    data
  );
}
export function createOrganisationHospital(data) {
  return apiPost(
    '/hospitals/create.php',
    data
  );
}


export function changeOrganisationHospitalStatus(
  hospitalId,
  status,
  reason = ''
) {
  return apiPost(
    '/hospitals/status.php',
    {
      hospital_id: hospitalId,
      status,
      reason,
    }
  );
}


export function createHospitalAdmin(data) {
  return apiPost(
    '/hospital-admins/create.php',
    data
  );
}