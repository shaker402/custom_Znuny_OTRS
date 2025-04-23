import React, { useState, useEffect, useContext, useRef, useLayoutEffect } from "react";
import axios from "axios";
import GeneralContext from "../../Context";
import "./Responder_main.css";

function Responder_main({ show_SideBar, set_show_SideBar, set_visblePage }) {
  set_visblePage("Responder");
  const { backEndURL } = useContext(GeneralContext);

  const [clientList, setClientList] = useState([]);
  const [globalActionMenu, setGlobalActionMenu] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputState, setInputState] = useState(null); // For the popup
  const [menuClient, setMenuClient] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [confirmation, setConfirmation] = useState(null);
  const [inlineForm, setInlineForm] = useState(null);
  const actionMenuRef = useRef(null);

  useEffect(() => {
    fetchClientList();
    if (!show_SideBar) set_show_SideBar(true);

    const handleClickOutside = () => {
      setMenuClient(null);
      setGlobalActionMenu(false);
      setInlineForm(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [show_SideBar, set_show_SideBar]);

  useLayoutEffect(() => {
    if (menuClient && actionMenuRef.current) {
      const menu = actionMenuRef.current;
      const { offsetWidth: w, offsetHeight: h } = menu;
      let { x, y } = menuPos;
      if (x + w > window.innerWidth) x = x - w;
      if (y + h > window.innerHeight) y = y - h;
      if (x !== menuPos.x || y !== menuPos.y) {
        setMenuPos({ x, y });
      }
    }
  }, [menuClient, menuPos]);

  const fetchClientList = async () => {
    try {
      const { data } = await axios.get(`${backEndURL}/Responder/GetClientList`);
      setClientList(data);
    } catch (error) {
      console.error("Error fetching client list:", error);
    }
  };

  const handleAction = async (action, hostname = null, value = null) => {
    if (action.includes("quarantine") && !confirmation) {
      setConfirmation({ action, hostname, value });
      return;
    }

    try {
      const payload = { action, value };
      if (hostname) payload.hostname = hostname;
      const response = await axios.post(`${backEndURL}/Responder/ExecuteAction`, payload);
      alert(response.data.msg);
      fetchClientList();
    } catch (error) {
      console.error("Error executing action:", error);
      alert("Error executing action");
    } finally {
      setMenuClient(null);
      setGlobalActionMenu(false);
      setConfirmation(null);
    }
  };

  const handleCheckState = async () => {
    if (!inputValue) {
      alert("Please enter an IP or domain to check.");
      return;
    }
    try {
      const response = await axios.get(`${backEndURL}/Responder/CheckState`, { params: { value: inputValue } });
      const { output } = response.data;

      // Parse the output to extract table data
      const lines = output.split("\n");
      const tableData = [];
      let headers = [];

      lines.forEach((line, index) => {
        if (line.includes("+--")) return; // Skip separator lines
        const columns = line.split("|").map((col) => col.trim()).filter(Boolean);
        if (columns.length > 0) {
          if (index === 2) {
            headers = columns; // Extract headers
          } else if (index > 2) {
            tableData.push(columns); // Extract table rows
          }
        }
      });

      setInputState({ headers, tableData });
    } catch (error) {
      console.error("Error checking state:", error);
      alert("Error checking state");
    }
  };

  const openActionMenu = (e, client) => {
    e.stopPropagation();
    setMenuClient(client);
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleInlineFormSubmit = async (action, value) => {
    if (!value) {
      alert("Please enter a value.");
      return;
    }
    await handleAction(action, null, value);
    setInlineForm(null);
  };

  return (
    <div className="responder-container">
      <h1>Responder Dashboard</h1>

      <div className="responder-sections">
        {/* --- Global Actions Section --- */}
        <div className="section global-section" onClick={(e) => e.stopPropagation()}>
          <div className="global-actions">
            <input
              type="text"
              placeholder="Enter IP or Domain"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button onClick={handleCheckState}>Check State</button>
            <div className="global-menu-container">
              <button
                className="global-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setGlobalActionMenu((prev) => !prev);
                }}
              >
                Global Actions ⋮
              </button>
				{globalActionMenu && (
				  <div className="action-menu" onClick={(e) => e.stopPropagation()}>
					<button
					  onClick={() => {
						setInlineForm({ action: "block-ip-global" });
						setGlobalActionMenu(false); // Close the dropdown
					  }}
					>
					  Block IP Globally
					</button>
					<button
					  onClick={() => {
						setInlineForm({ action: "unblock-ip-global" });
						setGlobalActionMenu(false); // Close the dropdown
					  }}
					>
					  Unblock IP Globally
					</button>
					<button
					  onClick={() => {
						setInlineForm({ action: "block-domain-global" });
						setGlobalActionMenu(false); // Close the dropdown
					  }}
					>
					  Block Domain Globally
					</button>
					<button
					  onClick={() => {
						setInlineForm({ action: "unblock-domain-global" });
						setGlobalActionMenu(false); // Close the dropdown
					  }}
					>
					  Unblock Domain Globally
					</button>
				  </div>
				)}
            </div>
          </div>

          {inputState && (
            <div className="state-popup">
              <div className="state-popup-content">
                <button className="close-popup" onClick={() => setInputState(null)}>×</button>
                <h3>Current State for {inputValue}</h3>
                <table>
                  <thead>
                    <tr>
                      {inputState.headers.map((header, idx) => (
                        <th key={idx}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inputState.tableData.map((row, idx) => (
                      <tr key={idx}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
		  

          {inlineForm && (
            <div className="inline-form">
              <input
                type="text"
                placeholder="Enter value"
                onChange={(e) => setInlineForm({ ...inlineForm, value: e.target.value })}
              />
              <button onClick={() => handleInlineFormSubmit(inlineForm.action, inlineForm.value)}>
                Submit
              </button>
            </div>
          )}
        </div>

        {/* --- Client Table Section --- */}
        <div className="section table-section">
          <div className="client-table">
            <table>
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>OS</th>
                  <th>Last Seen</th>
                  <th>State</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {clientList.map((client, idx) => (
                  <tr key={idx}>
                    <td>{client.hostname}</td>
                    <td>{client.os}</td>
                    <td>{client.last_seen_at}</td>
                    <td className={client.state === "online" ? "online" : "offline"}>
                      {client.state}
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={(e) => openActionMenu(e, client)}
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* --- Per‑row Action Menu --- */}
      {menuClient && (
        <div
          ref={actionMenuRef}
          className="action-menu"
          style={{ top: menuPos.y, left: menuPos.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => handleAction("quarantine", menuClient.hostname)}>
            Quarantine this host
          </button>
          <button onClick={() => handleAction("unquarantine", menuClient.hostname)}>
            Unquarantine this host
          </button>
          <button
            onClick={() => {
              const value = prompt("Enter IP to block:");
              if (value) handleAction("block-ip", menuClient.hostname, value);
            }}
          >
            Block IP
          </button>
          <button
            onClick={() => {
              const value = prompt("Enter Domain to block:");
              if (value) handleAction("block-domain", menuClient.hostname, value);
            }}
          >
            Block Domain
          </button>
          <button
            onClick={() => {
              const value = prompt("Enter IP to unblock:");
              if (value) handleAction("unblock-ip", menuClient.hostname, value);
            }}
          >
            Unblock IP
          </button>
          <button
            onClick={() => {
              const value = prompt("Enter Domain to unblock:");
              if (value) handleAction("unblock-domain", menuClient.hostname, value);
            }}
          >
            Unblock Domain
          </button>
        </div>
      )}
      {/* --- Confirmation Dialog --- */}
      {confirmation && (
        <div className="confirmation-dialog">
          <p>Are you sure you want to {confirmation.action}?</p>
          <button onClick={() => handleAction(confirmation.action, confirmation.hostname, confirmation.value)}>
            Yes
          </button>
          <button onClick={() => setConfirmation(null)}>No</button>
        </div>
      )}
    </div>
  );
}

export default Responder_main;