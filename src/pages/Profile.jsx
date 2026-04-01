import { useState } from 'react';
import { Mail, ShieldAlert, UserCircle2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useAppContext } from '../context/useAppContext';
import './Profile.css';

const blankContact = { id: null, email: '', is_primary: false };

export default function Profile() {
  const { profile, addEmergencyContact, updateEmergencyContact } = useAppContext();
  const [draft, setDraft] = useState(blankContact);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!profile) return null;

  const submit = async () => {
    if (draft.id) {
      await updateEmergencyContact(draft.id, draft);
    } else {
      await addEmergencyContact(draft);
    }
    setDraft(blankContact);
    setConfirmOpen(false);
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage the admin account and emergency alert recipients stored in the database.</p>
      </div>

      <div className="profile-page__grid">
        <div className="glass-card profile-page__card">
          <div className="profile-page__identity">
            <div className="profile-page__avatar"><UserCircle2 size={42} /></div>
            <div>
              <h3>{profile.name}</h3>
              <p>{profile.role}</p>
              <span>{profile.email}</span>
            </div>
          </div>
        </div>

        <div className="glass-card profile-page__card">
          <div className="profile-page__card-header">
            <div>
              <h3>Emergency Contact Emails</h3>
              <p>Critical alerts can send real emails here when SMTP is configured.</p>
            </div>
            <ShieldAlert size={20} />
          </div>

          <div className="profile-page__contact-list">
            {profile.emergency_contacts.map((contact) => (
              <button
                key={contact.id}
                className="profile-page__contact-item"
                onClick={() => setDraft(contact)}
              >
                <div>
                  <strong>{contact.email}</strong>
                  <p>{contact.is_primary ? 'Primary contact' : 'Backup contact'}</p>
                </div>
                <span>Edit</span>
              </button>
            ))}
          </div>

          <form
            className="profile-page__form"
            onSubmit={(event) => {
              event.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <label>Email</label>
            <div className="profile-page__input">
              <Mail size={16} />
              <input
                type="email"
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                placeholder="alerts@example.com"
                required
              />
            </div>
            <label className="profile-page__checkbox">
              <input
                type="checkbox"
                checked={draft.is_primary}
                onChange={(event) => setDraft((current) => ({ ...current, is_primary: event.target.checked }))}
              />
              Set as primary emergency recipient
            </label>
            <button type="submit" className="btn-primary">
              {draft.id ? 'Update Email' : 'Add Email'}
            </button>
          </form>
        </div>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Email Update" width="440px">
        <div className="profile-page__confirm">
          <p>
            {draft.id ? 'Update' : 'Add'} <strong>{draft.email}</strong> as an emergency contact email?
          </p>
          <div className="profile-page__confirm-actions">
            <button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submit}>
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
