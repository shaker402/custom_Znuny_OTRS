import React, {
    useState,
    useEffect,
    useContext,
    useRef,
    useLayoutEffect,
  } from "react";
  import axios from "axios";
  import GeneralContext from "../../Context";
  

const TicketSearch = ({ show_SideBar, set_show_SideBar, set_visblePage }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(
                `/znuny/nph-genericinterface.pl/Webservice/ALERTELAST_API/Ticket?query=${query}`
            );
            setResults(response.data || []);
        } catch (error) {
            console.error("Error searching tickets:", error);
        }
    };

    useEffect(() => {
        set_visblePage("tickets/search");
    }, [set_visblePage]);

    return (
        <div className="page-container">
            <h1>Search Tickets</h1>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search by TicketNumber or Priority"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>
            <ul>
                {results.map((ticket) => (
                    <li key={ticket.TicketNumber}>
                        <h3>{ticket.Title}</h3>
                        <p>Queue: {ticket.Queue}</p>
                        <p>Status: {ticket.State}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TicketSearch;