import {
  apiGet,
  apiPost,
} from './api';


export function getHospitalAdminHospital() {
  return apiGet(
    '/hospitals/my-hospital.php'
  );
}


export function getHospitalAdminDashboard() {
  return apiGet(
    '/hospitals/dashboard.php'
  );
}


export function getHospitalPersonnel() {
  return apiGet(
    '/personnel/list.php'
  );
}


export function createHospitalPersonnel(data) {
  return apiPost(
    '/personnel/create.php',
    data
  );
}


export function updateHospitalPersonnel(
  personnelUserId,
  data
) {
  return apiPost(
    '/personnel/update.php',
    {
      personnel_user_id:
        personnelUserId,
      ...data,
    }
  );
}


export function updatePersonnelStatus(
  personnelUserId,
  status
) {
  return apiPost(
    '/personnel/status.php',
    {
      personnel_user_id:
        personnelUserId,
      status,
    }
  );
}
export function updateOwnHospital(data) {
  return apiPost(
    '/hospitals/update-own.php',
    data
  );
}


export function getOrganisationHospitalNotices() {
  return apiGet(
    '/hospitals/notices.php'
  );
}


export function markOrganisationHospitalNoticeRead(
  noticeId
) {
  return apiPost(
    '/hospitals/notice-read.php',
    {
      notice_id: noticeId,
    }
  );
}