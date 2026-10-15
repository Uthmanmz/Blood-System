import { useState, useSyncExternalStore } from 'react';

import {
  readDemoData,
  sendHospitalPreviewMessage,
  subscribeToDemoChanges,
} from '../services/demoStore';

const messageTypes = [
  ['Donation Invitation', 'donor'],
  ['Appreciation', 'donor'],
  ['Seasonal Greeting', 'donor'],
  ['General Donor Announcement', 'donor'],
  ['Personnel Notice', 'personnel'],
];

function MessageForm({ hospitalId, purpose, recipientRole, senderPersonnelId }) {
  const [feedback, setFeedback] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  useSyncExternalStore(subscribeToDemoChanges, () => JSON.stringify((readDemoData().personnel || []).map((item) => [item.id, item.status]).concat((readDemoData().donors || []).map((item) => item.id))), () => '[]');
  const liveData = readDemoData();

  const recipients = (
    recipientRole === 'donor'
      ? liveData.donors || []
      : liveData.personnel.filter((person) => person.status === 'Active')
  ).filter(
    (person) =>
      person.hospitalId === hospitalId &&
      (
        recipientRole !== 'donor' ||
        !bloodGroup ||
        person.bloodGroup === bloodGroup
      )
  );

  function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const values = new FormData(form);

    const recipientIds = values.getAll('recipientIds');

    const visibleIds = new Set(recipients.map((person) => person.id));

    try {
      const count = sendHospitalPreviewMessage({
        hospitalId,
        purpose,
        recipientRole,
        subject: values.get('subject'),
        body: values.get('body'),
        recipientIds: recipientIds.filter((id) => visibleIds.has(id)),
        senderPersonnelId,
      });

      form.reset();

      setFeedback(
        `Added to ${count} preview inbox${count === 1 ? '' : 'es'}. No SMS or email was sent.`
      );
    } catch (error) {
      setFeedback(error.message);
    }
  }

  return (
    <section className="workspace-panel">
      <h2>{purpose}</h2>

      {recipientRole === 'donor' && (
        <label className="application-field">
          Filter Donors by Blood Group
          <select
            className="organisation-select"
            value={bloodGroup}
            onChange={(event) => setBloodGroup(event.target.value)}
          >
            <option value="">All Blood Groups</option>

            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
              (group) => <option key={group}>{group}</option>
            )}
          </select>
        </label>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset className="permission-options">
          <legend>Select Recipients</legend>

          {recipients.length === 0 ? (
            <p>No matching recipients at this hospital.</p>
          ) : (
            recipients.map((person) => (
              <label key={`${bloodGroup}:${person.id}`}>
                <input
                  type="checkbox"
                  name="recipientIds"
                  value={person.id}
                />

                <span>
                  {person.fullName || person.name}

                  {recipientRole === 'donor' && (
                    <>
                      {' - '}{person.bloodGroup}
                      {' - '}
                      {person.available ? 'Available' : 'Not Available'}
                    </>
                  )}
                </span>
              </label>
            ))
          )}
        </fieldset>

        <label className="application-field">
          Subject
          <input name="subject" maxLength={150} required />
        </label>

        <label className="application-field">
          Message
          <textarea name="body" rows={5} maxLength={5000} required />
        </label>

        <button
          className="application-button"
          type="submit"
          disabled={recipients.length === 0}
        >
          Add to Preview Inboxes
        </button>

        {feedback && (
          <p className="application-message" role="status">
            {feedback}
          </p>
        )}
      </form>
    </section>
  );
}

function NotificationCenter({ hospitalId, canCompose = true, senderPersonnelId }) {
  const [selectedType, setSelectedType] = useState(
    'Donation Invitation'
  );

  const recipientRole = messageTypes.find(
    ([purpose]) => purpose === selectedType
  )[1];

  const sentSnapshot = useSyncExternalStore(
    subscribeToDemoChanges,
    () => JSON.stringify(
      (readDemoData().hospitalMessages || []).filter(
        (message) => message.hospitalId === hospitalId && (message.sender === 'Hospital staff preview' || message.sender?.endsWith('(personnel preview)'))
      )
    ),
    () => '[]'
  );
  const [page, setPage] = useState(1);
  const sentMessages = JSON.parse(sentSnapshot).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(sentMessages.length / pageSize));
  const visibleMessages = sentMessages.slice((page - 1) * pageSize, page * pageSize);
  const currentData = readDemoData();

  function recipientName(message) {
    const collection = message.recipientRole === 'donor'
      ? currentData.donors || []
      : currentData.personnel || [];
    const recipient = collection.find((item) => item.id === message.recipientId);
    return recipient?.fullName || recipient?.name || 'Recipient unavailable';
  }

  return (
    <>
      {!canCompose && <p className="application-message" role="status">Viewing your inbox is available. Message composition requires the Send Notifications responsibility.</p>}
      {canCompose && <div className="message-type-buttons">
        {messageTypes.map(([purpose]) => (
          <button
            type="button"
            key={purpose}
            className={
              selectedType === purpose
                ? 'message-type-button active'
                : 'message-type-button'
            }
            aria-pressed={selectedType === purpose}
            onClick={() => setSelectedType(purpose)}
          >
            {purpose}
          </button>
        ))}
      </div>}

      {canCompose && <MessageForm
        key={`${hospitalId}:${selectedType}`}
        hospitalId={hospitalId}
        purpose={selectedType}
        recipientRole={recipientRole}
        senderPersonnelId={senderPersonnelId}
      />}

      <section className="workspace-panel management-section">
        <h2>Sent Preview Messages</h2>
        <p>These entries were saved to local demo inboxes. No external delivery occurred.</p>
        {sentMessages.length === 0 ? <p className="workspace-empty">No preview messages sent yet.</p> : <div className="management-table-wrapper"><table className="management-table"><thead><tr><th>Purpose</th><th>Subject</th><th>Recipient</th><th>Saved</th><th>Inbox Status</th></tr></thead><tbody>{visibleMessages.map((message) => <tr key={message.id}><td>{message.purpose}</td><td>{message.subject}</td><td>{recipientName(message)}</td><td>{new Date(message.createdAt).toLocaleString()}</td><td>{message.readAt ? 'Read locally' : 'Unread locally'}</td></tr>)}</tbody></table></div>}
        {sentMessages.length > pageSize && <nav className="pagination" aria-label="Sent message pages"><button type="button" className="secondary-button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" className="secondary-button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></nav>}
      </section>
    </>
  );
}

export default NotificationCenter;
