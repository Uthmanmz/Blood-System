import {
  apiGet,
  apiPost,
} from './api';


export function loginUser(email, password) {
  return apiPost('/auth/login.php', {
    email,
    password,
  });
}


export function getCurrentUser() {
  return apiGet('/auth/me.php');
}


export function logoutUser() {
  return apiPost('/auth/logout.php');
}