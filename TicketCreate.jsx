import React, {
    useState,
    useEffect,
    useContext,
    useRef,
    useLayoutEffect,
  } from "react";
  import axios from "axios";
  import GeneralContext from "../../Context";
  

const TicketCreate = ({ show_SideBar, set_show_SideBar, set_visblePage }) => {
    const [title, setTitle] = useState("");
    const [queue, setQueue] = useState("");
    const [priority, setPriority] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/znuny/nph-genericinterface.pl/Webservice/ALERTELAST_API/Ticket", {
                Ticket: { Title: title, Queue: queue, Priority: priority },
            });
            setMessage("Ticket created successfully!");
            setTitle("");
            setQueue("");
            setPriority("");
        } catch (error) {
            console.error("Error creating ticket:", error);
            setMessage("Failed to create ticket.");
        }
    };

    useEffect(() => {
        set_visblePage("tickets/create");
    }, [set_visblePage]);

    return (
        <div className="page-container">
            <h1>Create Ticket</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Queue"
                    value={queue}
                    onChange={(e) => setQueue(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                />
                <button type="submit">Create</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default TicketCreate;