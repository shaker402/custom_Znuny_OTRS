import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import GeneralContext from "../../Context";
import ProcessTree from "./ProcessTree_TicketDetails";
import AttackStory from "./Attack_Story";
import AlertEvents from "./Alert_Events";
import './TicketDetails.css';

const tabs = [
  "Summary",
  "Alerts & Events",
  "Process Tree",
  "File Flow",
  "Network Flow",
  "Registry",
  "Threat Intel",
  "Raw Data",
];

const TicketDetails = () => {
  const { ticketNumber } = useParams();
  const navigate = useNavigate();
  const { backEndURL } = useContext(GeneralContext);
  const [ticket, setTicket] = useState(null);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `${backEndURL}/znuny/nph-genericinterface.pl/Webservice/ALERTELAST_API/Ticket/${ticketNumber}`
        );
        setTicket(data.Ticket[0]);
      } catch (e) {
        setError("Failed to fetch ticket details. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [backEndURL, ticketNumber]);

  if (loading) return <p>Loading ticket details...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!ticket) return <p>Ticket not found.</p>;

  const processTreeArticle = ticket.Articles?.find(a =>
    a.Subject.toLowerCase().includes("process_tree")
  )?.Body;

  const alertEventsArticle = ticket.Articles?.find(a =>
    a.Subject.toLowerCase().includes("alert & events")
  )?.Body;

  const fileFlow = ticket.Articles?.find(a =>
    a.Subject.toLowerCase().includes("file_flow")
  )?.Body;
  const networkFlow = ticket.Articles?.find(a =>
    a.Subject.toLowerCase().includes("network_flow")
  )?.Body;
  const registryFlow = ticket.Articles?.find(a =>
    a.Subject.toLowerCase().includes("registry_flow")
  )?.Body;
  const threatIntel = ticket.raw?.kibana?.alert?.rule?.tags;

  return (
    <div className="ticket-details">
      <a onClick={() => navigate(-1)} className="back-btn">← Back to List</a>
      <h1>{ticket.Title}</h1>
      <p className="meta">
        ID: <span>{ticketNumber}</span> | Status: <span>{ticket.State}</span> | Priority: <span>{ticket.Priority}</span>
      </p>

      <div className="tabs">
        <nav>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "active" : ""}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="tab-content">
        {/* Summary */}
        {activeTab === "Summary" && (
          <section>
            <h2>Metadata</h2>
            <div className="summary-grid">
              <div>
                <p><strong>Created:</strong> {new Date(ticket.Created).toLocaleString()}</p>
                <p><strong>Updated:</strong> {new Date(ticket.Updated).toLocaleString()}</p>
                <p><strong>Queue:</strong> {ticket.Queue}</p>
                <p><strong>Tags:</strong> {(ticket.raw?.kibana?.alert?.rule?.tags || []).join(", ") || 'None'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Alerts & Events */}
        {activeTab === "Alerts & Events" && (
          <section>
            <h2>Alerts & Events</h2>
            <AlertEvents
              processTreeArticle={processTreeArticle}
              alertEventsArticle={alertEventsArticle}
            />
          </section>
        )}

        {/* Process Tree */}
        {activeTab === "Process Tree" && (
          <section>
            <h2>Process Tree</h2>
            {processTreeArticle
              ? <div className="wrap-pre process-tree-wrapper">
                  <ProcessTree processTreeData={processTreeArticle} />
                </div>
              : <p>No process tree data.</p>
            }
          </section>
        )}

        {/* File Flow */}
        {activeTab === "File Flow" && (
          <section>
            <h2>File Flow</h2>
            <pre className="wrap-pre flow-pre">
              {fileFlow || 'No file flow data.'}
            </pre>
          </section>
        )}

        {/* Network Flow */}
        {activeTab === "Network Flow" && (
          <section>
            <h2>Network Flow</h2>
            <pre className="wrap-pre flow-pre">
              {networkFlow || 'No network flow data.'}
            </pre>
          </section>
        )}

        {/* Registry */}
        {activeTab === "Registry" && (
          <section>
            <h2>Registry Changes</h2>
            <pre className="wrap-pre flow-pre">
              {registryFlow || 'No registry flow data.'}
            </pre>
          </section>
        )}

        {/* Threat Intel */}
        {activeTab === "Threat Intel" && (
          <section>
            <h2>Threat Intelligence</h2>
            <ul>
              {threatIntel?.length
                ? threatIntel.map((tag, i) => <li key={i}>{tag}</li>)
                : <li>No threat intel tags.</li>
              }
            </ul>
          </section>
        )}

        {/* Raw Data */}
        {activeTab === "Raw Data" && (
          <section>
            <h2>Attack Story</h2>
            <AttackStory rawData={ticket} />
          </section>
        )}
      </div>
    </div>
  );
};

export default TicketDetails;