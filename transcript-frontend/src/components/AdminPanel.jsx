import React, { useState, useEffect, useCallback } from 'react';
import '../App.css'; // For potential reuse of styles

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
const _Scripz_api = '_Scripz_api'; // Define suffix for consistent substring calculation

function AdminPanel() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' }); // For success/error messages from CRUD actions

  const [adminApiPasswordInput, setAdminApiPasswordInput] = useState(''); // For the input field
  const [actualAdminApiPassword, setActualAdminApiPassword] = useState(''); // To store the set password

  // State for the Create New Key form
  const [newClientName, setNewClientName] = useState('');
  const [newRateLimitMonth, setNewRateLimitMonth] = useState(''); // Keep as string for input, parse on submit
  const [newNotes, setNewNotes] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [isCreating, setIsCreating] = useState(false); // For loading state of create button

  // State for Edit Key Modal/Form
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null); // Stores the full key object being edited
  const [editClientName, setEditClientName] = useState('');
  const [editRateLimitMonth, setEditRateLimitMonth] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSetApiPassword = (e) => {
    e.preventDefault();
    setActualAdminApiPassword(adminApiPasswordInput);
    setError(null); // Clear previous errors
    setActionMessage({ type: '', text: '' }); // Clear previous action messages
    // Fetch keys will be triggered by useEffect watching actualAdminApiPassword
  };

  const clearApiPassword = () => {
    setActualAdminApiPassword('');
    setAdminApiPasswordInput('');
    setKeys([]);
    setError(null);
    setActionMessage({ type: '', text: '' });
  };

  const fetchKeys = useCallback(async () => {
    if (!actualAdminApiPassword) {
      // setError('Admin API Password not set. Enter password to fetch keys.');
      // setKeys([]); // Ensure keys are cleared if no password
      return; // Don't fetch if password isn't set
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/api/keys`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': actualAdminApiPassword,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch keys and parse error json' }));
        // If auth fails, clear the stored password to force re-entry
        if (response.status === 401 || response.status === 403) {
          clearApiPassword(); // Clear password so user is prompted again
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setKeys(data);
    } catch (e) {
      console.error("Error fetching API keys:", e);
      setError(e.message || 'Failed to fetch API keys.');
      setKeys([]); // Clear keys on error
    } finally {
      setLoading(false);
    }
  }, [actualAdminApiPassword]);

  useEffect(() => {
    if (actualAdminApiPassword) {
      fetchKeys();
    } else {
      // Optionally, set an informational message if no password is set yet and keys are expected
      // setError("Enter the Admin API Password to load keys.");
      setKeys([]); // Clear keys display if password is cleared
    }
  }, [actualAdminApiPassword, fetchKeys]);

  useEffect(() => {
    // Add class to body when AdminPanel mounts
    document.body.classList.add('admin-view-active');

    // Cleanup function to remove class when AdminPanel unmounts
    return () => {
      document.body.classList.remove('admin-view-active');
    };
  }, []); // Empty dependency array means this effect runs only on mount and unmount

  const handleCreateKey = async (e) => {
    e.preventDefault();
    setActionMessage({ type: '', text: '' }); 

    if (!newClientName.trim()) {
      setActionMessage({ type: 'error', text: 'Client Name is required.' });
      return;
    }

    if (newRateLimitMonth.trim() === '') {
        setActionMessage({ type: 'error', text: 'Monthly Request Limit is required. Enter a number or -1 for infinite.' });
        return;
    }

    const limit = parseInt(newRateLimitMonth);
    if (isNaN(limit)) {
        setActionMessage({ type: 'error', text: 'Monthly Rate Limit must be a valid number (e.g., 1000, or -1 for infinite).' });
        return;
    } 
    // Further validation: allow -1 or any non-negative. Or >= 0 if 0 is a valid limit (meaning no requests allowed)
    // For now, assuming -1 or positive. If 0 is not allowed, add `limit <= 0 && limit !== -1`
    if (limit < -1) { // only -1 or positive integers allowed
         setActionMessage({ type: 'error', text: 'Monthly Rate Limit must be -1 (for infinite) or a non-negative number.' });
        return;
    }

    setIsCreating(true);

    const keyDetails = {
        client_name: newClientName.trim(),
        is_active: newIsActive,
        notes: newNotes.trim() || null,
        rate_limit_requests_per_month: limit, // Use the validated & parsed limit
    };

    try {
        const response = await fetch(`${API_BASE_URL}/admin/api/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': actualAdminApiPassword,
            },
            body: JSON.stringify(keyDetails),
        });
        const responseData = await response.json(); 
        if (!response.ok) {
            throw new Error(responseData.error || responseData.details || `HTTP error! status: ${response.status}`);
        }
        setActionMessage({ type: 'success', text: `API Key for "${responseData.client_name}" created! Key: ${responseData.api_key}` });
        setNewClientName('');
        setNewRateLimitMonth(''); // Reset to empty string for placeholder to show
        setNewNotes('');
        setNewIsActive(true);
        await fetchKeys(); 
    } catch (err) {
        console.error("Error creating API key:", err);
        setActionMessage({ type: 'error', text: err.message || 'Failed to create API key.' });
    } finally {
        setIsCreating(false);
    }
  };

  // --- EDIT KEY FUNCTIONS ---
  const openEditModal = (keyToEdit) => {
    setEditingKey(keyToEdit);
    setEditClientName(keyToEdit.client_name);
    setEditRateLimitMonth(String(keyToEdit.rate_limit_requests_per_month)); // Keep as string for input
    setEditNotes(keyToEdit.notes || '');
    setEditIsActive(keyToEdit.is_active);
    setShowEditModal(true);
    setActionMessage({ type: '', text: '' }); // Clear any previous messages
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingKey(null);
    // Optionally clear edit form fields if desired, though they'll be reset on next open
  };

  const handleUpdateKey = async (e) => {
    e.preventDefault();
    if (!editingKey) return;
    setActionMessage({ type: '', text: '' });

    if (!editClientName.trim()) {
      setActionMessage({ type: 'error', text: 'Client Name is required for update.' });
      return;
    }
    if (editRateLimitMonth.trim() === '') {
        setActionMessage({ type: 'error', text: 'Monthly Request Limit is required. Enter a number or -1 for infinite.' });
        return;
    }
    const limit = parseInt(editRateLimitMonth);
    if (isNaN(limit)) {
        setActionMessage({ type: 'error', text: 'Monthly Rate Limit must be a valid number (e.g., 1000, or -1 for infinite).' });
        return;
    }
    if (limit < -1) {
         setActionMessage({ type: 'error', text: 'Monthly Rate Limit must be -1 (for infinite) or a non-negative number.' });
        return;
    }

    setIsUpdating(true);
    const updatedKeyDetails = {
        client_name: editClientName.trim(),
        rate_limit_requests_per_month: limit,
        notes: editNotes.trim() || null,
        is_active: editIsActive,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/admin/api/keys/${editingKey.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': actualAdminApiPassword,
        },
        body: JSON.stringify(updatedKeyDetails),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || `HTTP error! status: ${response.status}`);
      }
      setActionMessage({ type: 'success', text: `Key for "${responseData.client_name}" updated successfully.` });
      await fetchKeys(); // Refresh the list
      closeEditModal();
    } catch (err) {
      console.error("Error updating API key:", err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to update API key.' });
      // Keep modal open on error so user can see the issue / try again
    } finally {
      setIsUpdating(false);
    }
  };

  // --- DELETE KEY FUNCTION ---
  const handleDeleteKey = async (keyToDelete) => {
    if (!window.confirm(`Are you sure you want to delete the API key for "${keyToDelete.client_name}"? This action cannot be undone.`)) {
      return;
    }
    setActionMessage({ type: '', text: '' });
    setLoading(true); // Use main loading indicator or a specific one

    try {
      const response = await fetch(`${API_BASE_URL}/admin/api/keys/${keyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': actualAdminApiPassword,
        },
      });
      // No JSON response expected usually for DELETE, check status
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error message
        throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
      }
      setActionMessage({ type: 'success', text: `API key for "${keyToDelete.client_name}" deleted successfully.` });
      await fetchKeys(); // Refresh list
    } catch (err) {
      console.error("Error deleting API key:", err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete API key.' });
    } finally {
      setLoading(false);
    }
  };

  if (!actualAdminApiPassword) {
    return (
      <div className="admin-panel-wrapper" style={{ padding: '20px', maxWidth: '600px', margin: '40px auto' }}>
        <div className="info-card" style={{ padding: '30px' }}>
          <h2 className="password-card-title" style={{ fontSize: '1.6rem', marginBottom: '15px' }}>Enter Admin API Password</h2>
          <p className="password-card-text" style={{ fontSize: '0.95rem', marginBottom: '20px' }}>
            To manage API keys, please enter the password configured for backend Admin API access 
            (this is the <code>ADMIN_PASSWORD_FOR_KEY_MANAGEMENT</code> value from the API's <code>.env</code> file).
          </p>
          <form onSubmit={handleSetApiPassword} className="password-card-form">
            <input
              type="password"
              value={adminApiPasswordInput}
              onChange={(e) => setAdminApiPasswordInput(e.target.value)}
              placeholder="Admin API Password"
              className="password-card-input"
              style={{ marginBottom: '15px' }}
            />
            <button type="submit" className="button password-card-button">
              Set Password & Load Keys
            </button>
          </form>
          {error && <p className="password-card-error" style={{ marginTop: '15px' }}>{error}</p>}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <a href="/" className="button" style={{ backgroundColor: '#777', fontSize: '0.9rem', padding: '10px 15px' }}>Back to Main Site</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-wrapper" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="admin-panel-header">
        <h1 className="title">API Key Management</h1>
      </div>
      
      {actionMessage.text && 
        <div className={`action-message ${actionMessage.type === 'error' ? 'error-message' : (actionMessage.type === 'copy-success' ? 'copy-success' : 'success-message')}`}>
          {actionMessage.text}
        </div>
      }

      <div className="info-card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Create New API Key</h3>
        <form onSubmit={handleCreateKey} className="create-key-form">
            <div className="form-field">
                <label htmlFor="newClientName">Client Name <span style={{color: 'red'}}>*</span></label>
                <input 
                    type="text" 
                    id="newClientName" 
                    className="admin-input" 
                    value={newClientName} 
                    onChange={(e) => setNewClientName(e.target.value)} 
                    placeholder="E.g., My Awesome App"
                    required 
                />
            </div>
            <div className="form-field">
                <label htmlFor="newRateLimitMonth">Monthly Request Limit <span style={{color: 'red'}}>*</span></label>
                <input 
                    type="number" 
                    id="newRateLimitMonth" 
                    className="admin-input" 
                    value={newRateLimitMonth} // Bound to string state for easier input mgt
                    onChange={(e) => setNewRateLimitMonth(e.target.value)} 
                    placeholder="E.g., 1000 (-1 for Infinite)" 
                    required // HTML5 required attribute
                />
                 <small className="form-field-hint">Enter -1 for unlimited requests, or a non-negative number.</small>
            </div>
            <div className="form-field">
                <label htmlFor="newNotes">Notes (Optional)</label>
                <textarea 
                    id="newNotes" 
                    className="admin-input admin-textarea" 
                    value={newNotes} 
                    onChange={(e) => setNewNotes(e.target.value)} 
                    placeholder="Internal notes about this key" 
                    rows={3}
                />
            </div>
            <div className="form-field form-field-checkbox">
                <input 
                    type="checkbox" 
                    id="newIsActive" 
                    checked={newIsActive} 
                    onChange={(e) => setNewIsActive(e.target.checked)} 
                />
                <label htmlFor="newIsActive">Key is Active</label>
            </div>
            <button type="submit" className="button" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create API Key'}
            </button>
        </form>
      </div>

      {/* Edit Key Modal */} 
      {showEditModal && editingKey && (
        <div className="modal-backdrop">
          <div className="modal-content info-card admin-form-card">
            <h3 className="admin-card-title">Edit API Key: {editingKey.client_name}</h3>
            <form onSubmit={handleUpdateKey} className="admin-form">
              <div className="form-field">
                  <label htmlFor="editClientName">Client Name <span style={{color: 'red'}}>*</span></label>
                  <input 
                      type="text" 
                      id="editClientName" 
                      className="admin-input" 
                      value={editClientName} 
                      onChange={(e) => setEditClientName(e.target.value)} 
                      required 
                  />
              </div>
              <div className="form-field">
                  <label htmlFor="editRateLimitMonth">Monthly Request Limit <span style={{color: 'red'}}>*</span></label>
                  <input 
                      type="number" 
                      id="editRateLimitMonth" 
                      className="admin-input" 
                      value={editRateLimitMonth} 
                      onChange={(e) => setEditRateLimitMonth(e.target.value)} 
                      placeholder="E.g., 1000 (-1 for Infinite)" 
                      required
                  />
                  <small className="form-field-hint">Enter -1 for unlimited requests, or a non-negative number.</small>
              </div>
              <div className="form-field">
                  <label htmlFor="editNotes">Notes (Optional)</label>
                  <textarea 
                      id="editNotes" 
                      className="admin-input admin-textarea" 
                      value={editNotes} 
                      onChange={(e) => setEditNotes(e.target.value)} 
                      placeholder="Internal notes about this key" 
                      rows={3}
                  />
              </div>
              <div className="form-field form-field-checkbox">
                  <input 
                      type="checkbox" 
                      id="editIsActive" 
                      checked={editIsActive} 
                      onChange={(e) => setEditIsActive(e.target.checked)} 
                  />
                  <label htmlFor="editIsActive">Key is Active</label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="button admin-button-submit" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="button button-secondary" onClick={closeEditModal} disabled={isUpdating}>
                    Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="info-card">
        <h3 style={{ marginTop: 0 }}>Existing API Keys</h3>
        {loading && <p>Loading keys...</p>}
        {error && <p style={{ color: 'red' }}>Error fetching keys: {error}</p>}
        {!loading && !error && keys.length === 0 && actualAdminApiPassword && <p>No API keys found.</p>}
        {!loading && !error && !actualAdminApiPassword && <p>Admin API Password not set. Enter password above to load keys.</p>}

        {!loading && keys.length > 0 && (
          <div className="table-responsive-wrapper">
            <table className="api-keys-table">
                <thead>
                <tr>
                    <th>Client Name</th>
                    <th>API Key <small>(Click parts to copy)</small></th> 
                    <th>Active</th>
                    <th>Monthly Limit</th>
                    <th>Created At</th>
                    <th>Last Used</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {keys.map((key) => (
                    <tr key={key.id}>
                    <td>{key.client_name}</td>
                    <td className="api-key-cell">
                        <span 
                            title="Copy first part"
                            style={{cursor: 'pointer'}}
                            onClick={() => navigator.clipboard.writeText(key.api_key.substring(0, 8)).then(() => setActionMessage({type: 'copy-success', text: `Copied ${key.api_key.substring(0,8)}...`}), () => setActionMessage({type:'error', text:'Failed to copy'}))}
                        >{key.api_key.substring(0, 8)}</span>
                        <span>...</span>
                        <span 
                            title="Copy middle part (UUID v4 chars 9-12)"
                            style={{cursor: 'pointer'}}
                            onClick={() => navigator.clipboard.writeText(key.api_key.substring(9, 13)).then(() => setActionMessage({type: 'copy-success', text: `Copied ...${key.api_key.substring(9,13)}...`}), () => setActionMessage({type:'error', text:'Failed to copy'}))}
                        >{key.api_key.substring(9, 13)}</span>
                        <span>...</span>
                        <span 
                            className="api-key-suffix"
                            title="Copy suffix"
                            style={{cursor: 'pointer'}}
                            onClick={() => navigator.clipboard.writeText(key.api_key.substring(key.api_key.length - (_Scripz_api.length+1)))      .then(() => setActionMessage({type: 'copy-success', text: `Copied ...${key.api_key.substring(key.api_key.length - (_Scripz_api.length+1))}`}), () => setActionMessage({type:'error', text:'Failed to copy'}))}
                        >
                            {key.api_key.substring(key.api_key.length - (_Scripz_api.length+1))}
                        </span>
                         <button 
                            onClick={() => navigator.clipboard.writeText(key.api_key).then(() => setActionMessage({type: 'copy-success', text: `Copied full key for ${key.client_name}`}), () => setActionMessage({type:'error', text:'Failed to copy'}))}
                            className="button button-small button-copy"
                            title="Copy Full API Key"
                            style={{marginLeft: '10px'}}
                         >Copy Full</button>
                    </td>
                    <td>{key.is_active ? 'Yes' : 'No'}</td>
                    <td>{key.rate_limit_requests_per_month === -1 ? 'Infinite' : key.rate_limit_requests_per_month}</td>
                    <td>{new Date(key.created_at).toLocaleString()}</td>
                    <td>{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}</td>
                    <td>
                        <button onClick={() => openEditModal(key)} className="button button-small button-edit">Edit</button>
                        <button onClick={() => handleDeleteKey(key)} className="button button-small button-delete">Delete</button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '20px' }}>
        <a href="/" className="button button-secondary">Back to Main Site</a>
      </div>
    </div>
  );
}

// Basic styles for the table (can be moved to App.css)
const tableHeaderStyle = {
  borderBottom: '2px solid #ddd',
  padding: '10px 8px',
  textAlign: 'left',
  backgroundColor: '#f9f9f9',
};

const tableCellStyle = {
  borderBottom: '1px solid #eee',
  padding: '10px 8px',
  verticalAlign: 'top'
};

const actionButtonStyle = {
    marginRight: '5px',
    padding: '5px 10px',
    fontSize: '0.85rem',
    cursor: 'pointer'
}

export default AdminPanel; 