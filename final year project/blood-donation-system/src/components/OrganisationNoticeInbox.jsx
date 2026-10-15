import { useState, useSyncExternalStore } from 'react';
import {
  getHospitalOrganisationNotices,
  markOrganisationNoticeRead,
  subscribeToDemoChanges,
} from '../services/demoStore';

function OrganisationNoticeInbox({ hospitalId }) {
  const [openedId, setOpenedId] = useState('');
  const snapshot = useSyncExternalStore(
    subscribeToDemoChanges,
    () => JSON.stringify(getHospitalOrganisationNotices(hospitalId)),
    () => '[]'
  );
  const notices = JSON.parse(snapshot);
  const unread = notices.filter(
    (notice) => !(notice.readByHospitalIds || []).includes(hospitalId)
  ).length;

  function openNotice(notice) {
    const opening = openedId !== notice.id;
    setOpenedId(opening ? notice.id : '');
    if (opening && !(notice.readByHospitalIds || []).includes(hospitalId)) {
      markOrganisationNoticeRead(notice.id, hospitalId);
    }
  }

  return (
    <section className="workspace-panel management-section">
      <div className="management-heading"><h2>Organisation Notices</h2>{unread > 0 && <span className="notification-unread-badge">{unread} unread</span>}</div>
      {notices.length === 0 ? <p>No organisation notices for this hospital.</p> : <div className="inbox-list">{notices.map((notice) => {
        const read = (notice.readByHospitalIds || []).includes(hospitalId);
        return <article className={read ? 'inbox-item' : 'inbox-item inbox-unread'} key={notice.id}><button className="inbox-message-toggle" type="button" aria-expanded={openedId === notice.id} onClick={() => openNotice(notice)}><strong>{notice.subject}</strong><span>{read ? 'Read' : 'Unread'}</span></button><small>{new Date(notice.createdAt).toLocaleString()}</small>{openedId === notice.id && <p className="organisation-message-body">{notice.message}</p>}</article>;
      })}</div>}
    </section>
  );
}

export default OrganisationNoticeInbox;
