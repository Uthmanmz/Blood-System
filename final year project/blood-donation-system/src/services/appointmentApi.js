import {
  apiGet,
  apiPost,
} from './api';


/* =========================================
   DONOR APPOINTMENTS
========================================= */

export function getMyAppointments() {
  return apiGet(
    '/appointments/my-appointments.php'
  );
}


export function bookDonationAppointment(
  data
) {
  return apiPost(
    '/appointments/book.php',
    data
  );
}


export function cancelMyAppointment(
  appointmentId
) {
  return apiPost(
    '/appointments/cancel.php',
    {
      appointment_id:
        appointmentId,
    }
  );
}


/* =========================================
   HOSPITAL / PERSONNEL APPOINTMENTS
========================================= */

export function getHospitalAppointments() {
  return apiGet(
    '/appointments/hospital-list.php'
  );
}


export function completeHospitalAppointment(
  appointmentId
) {
  return apiPost(
    '/appointments/complete.php',
    {
      appointment_id:
        appointmentId,
    }
  );
}


export function cancelHospitalAppointment(
  appointmentId
) {
  return apiPost(
    '/appointments/hospital-cancel.php',
    {
      appointment_id:
        appointmentId,
    }
  );
}