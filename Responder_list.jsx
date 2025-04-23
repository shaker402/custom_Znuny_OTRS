// frontend/Components/Responder/Responder_list.jsx
import React, { useState, useEffect } from 'react';
import { ReactComponent as MenuIcon } from '../icons/ico-menu-monitor.svg';
import { ReactComponent as LoadingIcon } from '../icons/loader_typea.svg';

const Responder_list = ({ ClientsData, handleAction, Loading }) => {
  const [inputValues, setInputValues] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  const handleSubmit = async (hostname, action) => {
    setProcessing(true);
    setCurrentAction(action);
    try {
      await handleAction(action, hostname, inputValues[hostname]);
    } finally {
      setProcessing(false);
      setActiveMenu(null);
      setInputValues(prev => ({...prev, [hostname]: ''}));
    }
  };

  const ActionInput = ({ hostname, action, placeholder }) => (
    <div className="action-input-group">
      <input
        type="text"
        className="action-input"
        placeholder={placeholder}
        value={inputValues[hostname] || ''}
        onChange={(e) => setInputValues(prev => ({
          ...prev,
          [hostname]: e.target.value
        }))}
        disabled={processing}
      />
      <button 
        className="action-button"
        onClick={() => handleSubmit(hostname, action)}
        disabled={processing}
      >
        {processing && currentAction === action ? (
          <LoadingIcon className="inline-loader" />
        ) : 'Submit'}
      </button>
    </div>
  );

  return (
    <div className="responsive-table-container">
      <div className="table-header">
        <div className="header-cell">Hostname</div>
        <div className="header-cell">OS</div>
        <div className="header-cell">Last Seen</div>
        <div className="header-cell">State</div>
        <div className="header-cell">Actions</div>
      </div>

      {!Loading && ClientsData.map(client => (
        <div className="table-row" key={client.client_id}>
          <div className="table-cell">{client.hostname}</div>
          <div className="table-cell">{client.os}</div>
          <div className="table-cell">{new Date(client.last_seen_at).toLocaleString()}</div>
          <div className={`table-cell status-indicator ${client.state.toLowerCase()}`}>
            <span className="status-dot"></span>
            {client.state}
          </div>
          <div className="table-cell action-cell">
            <div className="action-menu-wrapper">
              <MenuIcon 
                className={`menu-icon ${activeMenu === client.client_id ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === client.client_id ? null : client.client_id)}
              />
              
              {activeMenu === client.client_id && (
                <div className="action-menu-popover">
                  <div className="menu-section">
                    <h4 className="menu-section-title">{client.hostname}</h4>
                    <button 
                      className="menu-item"
                      onClick={() => handleAction('quarantine', client.hostname)}
                    >
                      Quarantine Host
                    </button>
                    <button 
                      className="menu-item"
                      onClick={() => handleAction('unquarantine', client.hostname)}
                    >
                      Unquarantine Host
                    </button>
                  </div>

                  <div className="menu-section">
                    <h4 className="menu-section-title">IP Management</h4>
                    <ActionInput 
                      hostname={client.hostname}
                      action="block-ip"
                      placeholder="Enter IP to block"
                    />
                    <ActionInput 
                      hostname={client.hostname}
                      action="unblock-ip"
                      placeholder="Enter IP to unblock"
                    />
                  </div>

                  <div className="menu-section">
                    <h4 className="menu-section-title">Domain Management</h4>
                    <ActionInput 
                      hostname={client.hostname}
                      action="block-domain"
                      placeholder="Enter domain to block"
                    />
                    <ActionInput 
                      hostname={client.hostname}
                      action="unblock-domain"
                      placeholder="Enter domain to unblock"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Responder_list;