import { apiGet, apiPost } from './api';

export function getHospitalBloodRequests() {
  return apiGet('/blood-requests/hospital-list.php');
}

export function reviewBloodRequest(requestId) {
  return apiPost('/blood-requests/review.php', {
    request_id: requestId,
  });
}

export function approveBloodRequest(requestId) {
  return apiPost('/blood-requests/approve.php', {
    request_id: requestId,
  });
}

export function readyBloodRequest(requestId) {
  return apiPost('/blood-requests/ready.php', {
    request_id: requestId,
  });
}

export function completeBloodRequest(requestId) {
  return apiPost('/blood-requests/complete.php', {
    request_id: requestId,
  });
}

export function rejectBloodRequest(
  requestId,
  reason
) {
  return apiPost('/blood-requests/reject.php', {
    request_id: requestId,
    reason,
  });
}

export function cancelBloodRequest(
  requestId,
  reason
) {
  return apiPost('/blood-requests/cancel.php', {
    request_id: requestId,
    reason,
  });
}