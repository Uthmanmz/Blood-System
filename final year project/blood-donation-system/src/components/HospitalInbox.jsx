import { useState, useSyncExternalStore } from 'react';

import {
  getHospitalMessages,
  markHospitalMessageRead,
  subscribeToDemoChanges,
} from '../services/demoStore';

function HospitalInbox({ hospitalId, recipientRole, recipientId }) {
  const [openedId, setOpenedId] = useState(null);

  const snapshot = useSyncExternalStore(
    subscribeToDemoChanges,
    () =>
      JSON.stringify(
        getHospitalMessages(hospitalId, recipientRole, recipientId)
      ),
    () => '[]'
  );

  const messages = JSON.parse(snapshot);

  function openMessage(message) {
    if (openedId === message.id) {
      setOpenedId(null);
      return;
    }

    markHospitalMessageRead(
      hospitalId,
      recipientRole,
      recipientId,
      message.id
    );

    setOpenedId(message.id);
  }

  if (!recipientId) {
    return <p>Select a sample recipient to view their inbox.</p>;
  }

  if (!messages.length) {
    return <p>No notifications for this recipient at this hospital.</p>;
  }

  return (
    <div className="hospital-list">
      {messages.map((message) => (
        <article
          className={`workspace-panel ${
            !message.readAt ? 'inbox-unread' : ''
          }`}
          key={message.id}
        >
          <button
            className="inbox-message-toggle"
            type="button"
            aria-expanded={openedId === message.id}
            onClick={() => openMessage(message)}
          >
            <strong>{message.subject}</strong>
            <span>{message.readAt ? 'Read' : 'Unread'}</span>
          </button>

          <p>
            {message.purpose}
            {' · '}
            {new Date(message.createdAt).toLocaleString()}
          </p>

          {openedId === message.id && (
            <p className="organisation-message-body">
              {message.body}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

export default HospitalInbox;