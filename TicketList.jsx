import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import GeneralContext from "../../Context";

const severityMap = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-orange-100 text-orange-800",
  Low: "bg-yellow-100 text-yellow-800",
  Informational: "bg-blue-100 text-blue-800",
};

const TicketList = ({ set_visblePage }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { backEndURL } = useContext(GeneralContext);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await axios.get(
          `${backEndURL}/znuny/nph-genericinterface.pl/Webservice/ALERTELAST_API/Tickets`
        );
        setTickets(data || []);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setError("Failed to fetch tickets. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();

    // Call set_visblePage only if it's defined
    if (typeof set_visblePage === "function") {
      set_visblePage("tickets");
    }
  }, [set_visblePage, backEndURL]);

  if (loading) return <p className="p-4">Loading tickets...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (tickets.length === 0) return <p className="p-4">No tickets found.</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Ticket List</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Severity</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Updated</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.TicketNumber} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-sm">{ticket.TicketNumber}</td>
                <td className="px-4 py-2">{ticket.Title}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      severityMap[ticket.Priority] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.Priority}
                  </span>
                </td>
                <td className="px-4 py-2 capitalize">{ticket.State}</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {new Date(ticket.Created).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {new Date(ticket.Updated).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => navigate(`/tickets/${ticket.TicketNumber}`)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketList;