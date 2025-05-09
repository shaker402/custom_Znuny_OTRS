import React, {
    useState,
    useEffect,
    useContext,
    useRef,
    useLayoutEffect,
  } from "react";
  import axios from "axios";
  import GeneralContext from "../../Context";
  

const TicketUpdate = ({ show_SideBar, set_show_SideBar, set_visblePage }) => {
    const [ticketNumber, setTicketNumber] = useState("");
    const [status, setStatus] = useState("");
    const [articleBody, setArticleBody] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`/znuny/nph-genericinterface.pl/Webservice/ALERTELAST_API/Ticket/${ticketNumber}`, {
                Ticket: { State: status },
                Article: { Body: articleBody },
            });
            setMessage("Ticket updated successfully!");
        } catch (error) {
            console.error("Error updating ticket:", error);
            setMessage("Failed to update ticket.");
        }
    };

    useEffect(() => {
        set_visblePage("tickets/update");
    }, [set_visblePage]);

    return (
        <div className="page-container">
            <h1>Update Ticket</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Ticket Number"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                />
                <textarea
                    placeholder="Article Body"
                    value={articleBody}
                    onChange={(e) => setArticleBody(e.target.value)}
                />
                <button type="submit">Update</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default TicketUpdate;