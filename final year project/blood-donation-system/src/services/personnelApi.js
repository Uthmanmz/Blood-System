import { apiGet } from './api';

export const PERSONNEL_PERMISSIONS = Object.freeze({
  DONORS: 'MANAGE_DONORS',
  APPOINTMENTS: 'MANAGE_APPOINTMENTS',
  DONATIONS: 'RECORD_DONATIONS',
  INVENTORY: 'MANAGE_INVENTORY',
  REQUESTS: 'PROCESS_BLOOD_REQUESTS',
  NOTIFICATIONS: 'SEND_NOTIFICATIONS',
});

export function getPersonnelPermissions() {
  return apiGet('/personnel/my-permissions.php');
}

export function getPersonnelDashboard() {
  return apiGet('/hospitals/dashboard.php');
}

export function getMyHospital() {
  return apiGet('/hospitals/my-hospital.php');
}