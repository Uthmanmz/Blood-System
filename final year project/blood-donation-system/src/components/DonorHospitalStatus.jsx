function DonorHospitalStatus({
  status,
}) {
  if (!status) {
    return null;
  }

  if (status === 'Suspended') {
    return (
      <p
        className="hospital-status-notice"
        role="status"
      >
        Your registered hospital is currently
        suspended from new activities. Your
        existing records remain available.
      </p>
    );
  }

  if (status !== 'Approved') {
    return (
      <p
        className="application-message"
        role="alert"
      >
        Your registered hospital is currently
        unavailable for new donation activities.
      </p>
    );
  }

  return null;
}

export default DonorHospitalStatus;