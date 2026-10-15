import { apiGet, apiPost } from './api';

export function getInventory() {
  return apiGet('/inventory/list.php');
}

export function getInventorySummary() {
  return apiGet('/inventory/summary.php');
}

export function releaseBloodUnit(bloodUnitId) {
  return apiPost('/inventory/release.php', {
    blood_unit_id: bloodUnitId,
  });
}

export function discardBloodUnit(
  bloodUnitId,
  reason
) {
  return apiPost('/inventory/discard.php', {
    blood_unit_id: bloodUnitId,
    reason,
  });
}