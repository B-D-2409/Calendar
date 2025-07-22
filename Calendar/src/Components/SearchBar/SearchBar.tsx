import { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

interface Location {
    address?: string;
    city?: string;
    [key: string]: any;
}

interface Event {
    _id: string;
    title: string;
    coverPhoto?: string;
    startDateTime?: string;
    startDate?: string;
    endDateTime?: string;
    endDate?: string;
    start?: string;
    end?: string;
    location?: Location;
    description?: string;
    participants: string[];
    type?: string;
    userId?: string | { toString(): string };
    [key: string]: any;
}

const Searchbar = () => {
    const [query, setQuery] = useState("");
    const [expanded, setExpanded] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const isOnHomepage = location.pathname === "/homepage";
    const isOnPublicPage = location.pathname === "/public";

    useEffect(() => {
        const handleClearFromPage = () => {
            setQuery("");
        };

        window.addEventListener("clearNavSearch", handleClearFromPage);
        return () => {
            window.removeEventListener("clearNavSearch", handleClearFromPage);
        };
    }, []);

    const filterEventsByTitle = (
        events: Event[],
        searchQuery: string,
        myEventsArray: Event[] = [],
        participatingEventsArray: Event[] = []
    ) => {
        return events.filter((eventItem) => {
            const title = eventItem.title?.toLowerCase() || "";
            const titleMatches = searchQuery
                .toLowerCase()
                .split(" ")
                .some((word) => word && title.includes(word));

            if (!titleMatches) return false;

            if (isOnPublicPage) {
                return eventItem.type === "public";
            }

            if (eventItem.type === "public") return true;

            if (eventItem.type === "private") {
                const isCreator = myEventsArray.some((e) => e._id === eventItem._id);
                const isParticipant = participatingEventsArray.some((e) => e._id === eventItem._id);
                return isCreator || isParticipant;
            }

            return false;
        });
    };

    const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && query.trim() !== "") {
            const token = localStorage.getItem("token");
            const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

            try {
                if (isOnPublicPage) {
                    const publicRes = await axios.get(`${key}/api/events/public`);
                    const freshPublicEvents: Event[] = Array.isArray(publicRes.data)
                        ? publicRes.data as Event[]
                        : [];
                    const filteredResults = filterEventsByTitle(freshPublicEvents, query);

                    window.dispatchEvent(
                        new CustomEvent("homepageSearch", {
                            detail: { results: filteredResults, term: query },
                        })
                    );
                    setExpanded(false);
                    setQuery("");
                    return;
                }

                const publicRes = await axios.get(`${key}/api/events/public`);
                const freshPublicEvents: Event[] = Array.isArray(publicRes.data)
                    ? publicRes.data as Event[]
                    : [];

                let freshMyEvents: Event[] = [];
                let freshParticipatingEvents: Event[] = [];

                if (token) {
                    try {
                        const myEventsRes = await axios.get(`${key}/api/events/mine`, { headers: authHeaders });
                        freshMyEvents = Array.isArray(myEventsRes.data)
                            ? myEventsRes.data as Event[]
                            : [];
                    } catch (err) {
                        console.error("Failed to fetch user events:", err);
                    }

                    try {
                        const participatingRes = await axios.get(`${key}/api/events/participants`, { headers: authHeaders });
                        freshParticipatingEvents = Array.isArray(participatingRes.data)
                            ? participatingRes.data as Event[]
                            : [];
                    } catch (err) {
                        console.error("Failed to fetch participating events:", err);
                    }
                }

                const allEventsMap = new Map<string, Event>();
                [...freshPublicEvents, ...freshMyEvents, ...freshParticipatingEvents].forEach((event) => {
                    if (event && event._id) {
                        allEventsMap.set(event._id, event);
                    }
                });
                const uniqueEvents = Array.from(allEventsMap.values());
                const filteredResults = filterEventsByTitle(uniqueEvents, query, freshMyEvents, freshParticipatingEvents);

                if (isOnHomepage) {
                    window.dispatchEvent(
                        new CustomEvent("homepageSearch", {
                            detail: { results: filteredResults, term: query },
                        })
                    );
                    setExpanded(false);
                    setQuery("");
                } else {
                    setQuery("");
                    navigate("/homepage", {
                        state: {
                            searchResults: filteredResults,
                            searchTerm: query,
                        },
                    });
                }
            } catch (err) {
                console.error("Failed to fetch events:", err);
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        if (e.target.value.trim() === "") {
            if (isOnHomepage || isOnPublicPage) {
                window.dispatchEvent(new CustomEvent("homepageClearSearch"));
            }
        }
    };

    const handleBlur = () => {
        setTimeout(() => {
            setExpanded(false);
            setQuery("");
        }, 150);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <input
                className="searchbar-field"
                type="text"
                value={query}
                placeholder="Search for events..."
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setExpanded(true)}
                onBlur={handleBlur}
                style={{
                    width: expanded ? "75%" : 255,
                    transition: "width 0.3s",
                    padding: "0.5rem 1rem",
                    fontSize: "1rem",
                    border: "2px solid #1976d2",
                    borderRadius: 8,
                    outline: "none",
                    background: "white",
                    color: "#111",
                }}
            />
        </div>
    );
};

export default Searchbar;
