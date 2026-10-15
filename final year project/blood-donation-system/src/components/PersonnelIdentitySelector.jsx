import { useEffect, useState } from 'react';
import {
  getActiveHospitalPersonnel,
  getPreviewPersonnel,
  selectPreviewPersonnel,
  clearPreviewPersonnel,
  subscribeToDemoChanges,
  getPersonnelResponsibilities,
} from '../services/demoStore';

function PersonnelIdentitySelector({ hospitalId, onSelected }) {
  const [people, setPeople] = useState(() => getActiveHospitalPersonnel(hospitalId));
  const [selectedId, setSelectedId] = useState(() => getPreviewPersonnel(hospitalId)?.id || '');
  const [message, setMessage] = useState('');

  useEffect(() => subscribeToDemoChanges(() => {
    const active = getActiveHospitalPersonnel(hospitalId);
    const selected = getPreviewPersonnel(hospitalId);
    setPeople(active);
    setSelectedId(selected?.id || '');
    if (!selected && selectedId) setMessage('The selected personnel member is no longer active. Select another active member.');
  }), [hospitalId, selectedId]);

  const selected = people.find((person) => person.id === selectedId);

  function change(event) {
    const id = event.target.value;
    setMessage('');
    if (!id) {
      clearPreviewPersonnel(hospitalId);
      setSelectedId('');
      onSelected?.(null);
      return;
    }
    try {
      const person = selectPreviewPersonnel(hospitalId, id);
      setSelectedId(id);
      onSelected?.(person);
    } catch (error) { setMessage(error.message); }
  }

  return (
    <section className="demo-identity" aria-labelledby="demo-personnel-heading">
      <p className="demo-mode-indicator">Demo Mode</p>
      <h2 id="demo-personnel-heading">Demo Personnel</h2>
      <label className="application-field">
        Frontend testing identity
        <select className="organisation-select" value={selectedId} onChange={change}>
          <option value="">Select active personnel</option>
          {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </label>
      {selected && <div className="identity-summary"><strong>{selected.name}</strong><span>{getPersonnelResponsibilities(selected).join(' · ') || 'No responsibilities assigned'}</span></div>}
      {!people.length && <p>No active personnel records exist for this hospital. Ask the Hospital Admin to add or enable one.</p>}
      {message && <p className="application-message" role="status">{message}</p>}
      <small>This selector is a frontend testing control, not secure authentication.</small>
    </section>
  );
}

export default PersonnelIdentitySelector;
