import { useEffect, useState } from 'react';
import {
  readDemoData, getPreviewHospitalId, setPreviewHospitalId, subscribeToDemoChanges,
} from '../services/demoStore';

function HospitalSelector({ onBeforeChange, onChange, selectedHospitalId, allowEmpty = false }) {
  const [data, setData] = useState(readDemoData);
  const [hospitalId, setHospitalId] = useState(getPreviewHospitalId);
  const [message, setMessage] = useState('');

  useEffect(() => subscribeToDemoChanges(() => setData(readDemoData())), []);
  useEffect(() => {
    if (selectedHospitalId !== undefined) setHospitalId(selectedHospitalId);
  }, [selectedHospitalId]);
  const selected = data.hospitals.find((hospital) => hospital.id === hospitalId);
  const hospitals = data.hospitals.filter(
    (hospital) => hospital.status === 'Approved' || hospital.id === hospitalId
  );

  function handleChange(event) {
    const nextId = event.target.value;
    if (nextId === hospitalId) return;
    if (onBeforeChange && !onBeforeChange()) return;
    try {
      setPreviewHospitalId(nextId);
      setHospitalId(nextId);
      onChange?.(nextId);
      setMessage('');
      window.dispatchEvent(new Event('preview-hospital-changed'));
    } catch (error) { setMessage(error.message); }
  }

  return <div>
    <label className="application-field">
      Hospital demo/testing context
      <select className="organisation-select" value={hospitalId} onChange={handleChange} disabled={!hospitals.length}>
        {allowEmpty && <option value="">Select an approved hospital</option>}
        {!hospitals.length && <option value="">No hospital records available</option>}
        {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id} disabled={hospital.status !== 'Approved'}>
          {hospital.name}{hospital.status !== 'Approved' ? ` (${hospital.status})` : ''}
        </option>)}
      </select>
      <small>This demo control keeps hospital records separate. Suspended hospitals remain visible for monitoring but cannot be selected for new activity.</small>
    </label>
    {!selected && hospitalId && <p className="application-message" role="status">The selected hospital record is unavailable. Choose an approved hospital from the demo control.</p>}
    {selected?.status === 'Suspended' && <p className="hospital-status-notice" role="status">This hospital is suspended. Existing monitoring records remain available; new bookings and blood requests are blocked.</p>}
    {message && <p className="application-message" role="status">{message}</p>}
  </div>;
}

export default HospitalSelector;
