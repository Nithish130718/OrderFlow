import { useMemo, useState } from 'react';
import { Mail, Plus, ShieldAlert, Trash2, UserCircle2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useAppContext } from '../context/useAppContext';
import './Profile.css';

const blankContact = { id: null, email: '', is_primary: false };

export default function Profile() {
  const { profile, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } = useAppContext();
  const [draft, setDraft] = useState(blankContact);
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const hasPrimary = useMemo(
    () => Boolean(profile?.emergency_contacts?.some((contact) => contact.is_primary)),
    [profile]
  );

  if (!profile) return null;

  const openAddModal = () => {
    setDraft(blankContact);
    setEditorOpen(true);
  };

  const openEditModal = (contact) => {
    setDraft(contact);
    setEditorOpen(true);
  };

  const submit = async () => {
    if (draft.id) {
      await updateEmergencyContact(draft.id, draft);
    } else {
      await addEmergencyContact(draft);
    }
    setConfirmOpen(false);
    setEditorOpen(false);
    setDraft(blankContact);
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
              <p>Critical alerts send to every saved email below. One contact can also be marked as primary.</p>
            </div>
            <ShieldAlert size={20} />
          </div>

          {!hasPrimary && (
            <div className="profile-page__warning">
              No primary recipient is currently set. Critical emails still go to all saved contacts, but marking one as primary makes the list clearer.
            </div>
          )}

          <div className="profile-page__contact-list">
            {profile.emergency_contacts.map((contact) => (
              <div key={contact.id} className="profile-page__contact-item">
                <button className="profile-page__contact-main" onClick={() => openEditModal(contact)}>
                  <div>
                    <strong>{contact.email}</strong>
                    <div className="profile-page__contact-badges">
                      <span className={`profile-page__contact-badge ${contact.is_primary ? 'profile-page__contact-badge--primary' : ''}`}>
                        {contact.is_primary ? 'Primary' : 'Backup'}
                      </span>
                      <span className="profile-page__contact-badge">Critical alerts recipient</span>
                    </div>
                  </div>
                  <span>Edit</span>
                </button>
                <button
                  className="profile-page__delete"
                  aria-label={`Delete ${contact.email}`}
                  onClick={() => setDeleteTarget(contact)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="profile-page__toolbar">
            <button className="btn-secondary" onClick={openAddModal}>
              <Plus size={16} /> Add Email
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setDraft(blankContact);
        }}
        title={draft.id ? 'Edit Emergency Email' : 'Add Emergency Email'}
        width="480px"
      >
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
          <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
            {draft.id ? 'Continue' : 'Continue'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Email" width="460px">
        <div className="profile-page__confirm">
          <p>
            {draft.id ? 'Update' : 'Add'} <strong>{draft.email}</strong> as an emergency contact?
            {draft.is_primary ? ' It will be marked as primary.' : ''}
          </p>
          <div className="profile-page__confirm-actions">
            <button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submit}>Confirm</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Email" width="440px">
        {deleteTarget && (
          <div className="profile-page__confirm">
            <p>Remove <strong>{deleteTarget.email}</strong> from the critical alert recipient list?</p>
            <div className="profile-page__confirm-actions">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  await deleteEmergencyContact(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                Delete Email
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
