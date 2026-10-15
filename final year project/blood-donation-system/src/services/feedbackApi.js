import {
  apiGet,
  apiPost,
} from './api';


export function submitPublicFeedback(data) {
  return apiPost(
    '/feedback/submit.php',
    data
  );
}


export function getAdminFeedback() {
  return apiGet(
    '/feedback/admin.php'
  );
}


export function updateAdminFeedback(
  feedbackId,
  status,
  adminNote = ''
) {
  return apiPost(
    '/feedback/admin.php',
    {
      feedback_id: feedbackId,
      status,
      admin_note: adminNote,
    }
  );
}