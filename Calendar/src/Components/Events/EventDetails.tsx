import React, { useEffect, useState, useContext, CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { MdPerson } from 'react-icons/md';
import { AuthContext, AuthContextType } from '../../Common/AuthContext';
import { CustomSpinner } from '../../Pages/PublicPage/PublicPage';

interface Participant {
    _id: string;
    username: string;
}

interface Location {
    address?: string;
    city?: string;
    country?: string;
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
    participants: Participant[];
    userId?: string | { toString(): string };
}

function EventDetails(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const { user } = useContext(AuthContext) as AuthContextType;
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isParticipant, setIsParticipant] = useState(false);

    const backendUrl = import.meta.env.VITE_BACK_END_URL || 'http://localhost:5000';

    useEffect(() => {
        async function fetchEvent() {
            try {
                setLoading(true);

                const token = localStorage.getItem("token");

                if (token) {
                    const response = await fetch(`${backendUrl}/api/events`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (!response.ok) throw new Error('Failed to fetch events');

                    const events: Event[] = await response.json();
                    const data = events.find(e => e._id === id);

                    if (!data) throw new Error('Event not found');

                    setEvent({
                        ...data,
                        start: data.startDateTime || data.startDate,
                        end: data.endDateTime || data.endDate,
                    });
                } else {
                    const response = await fetch(`${backendUrl}/api/events/public`);
                    if (!response.ok) throw new Error('Failed to fetch public events');

                    const publicEvents: Event[] = await response.json();
                    const data = publicEvents.find(e => e._id === id);

                    if (!data) throw new Error('Event not found or not public');

                    setEvent({
                        ...data,
                        start: data.startDateTime || data.startDate,
                        end: data.endDateTime || data.endDate,
                    });
                }
            } catch (err) {
                console.error(err);
                setEvent(null);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchEvent();
    }, [id, backendUrl]);

    useEffect(() => {
        if (event?.participants && user?._id) {
            setIsParticipant(event.participants.some(p => p._id === user._id));
        } else {
            setIsParticipant(false);
        }
    }, [event, user?._id]);

    const handleRemoveParticipant = async (participantId: string) => {
        try {
            const response = await fetch(`${backendUrl}/api/events/${id}/participants/${participantId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to remove participant');

            setEvent(prev => prev ? {
                ...prev,
                participants: prev.participants.filter(p => p._id !== participantId)
            } : null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLeaveEvent = async () => {
        try {
            setIsLeaving(true);
            const response = await fetch(`${backendUrl}/api/events/${id}/leave`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to leave event');
            if (!user) {
                return <div>Please login to see event details.</div>;
            }
        

            setEvent(prev => prev ? {
                ...prev,
                participants: prev.participants.filter(p => p._id !== user._id)
            } : null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLeaving(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center' }}><CustomSpinner /></div>;
    }

    if (!event) {
        return <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'red' }}>Event not found or failed to load.</p>
        </div>;
    }

    const isOwner = user ? event.userId && event.userId.toString() === user._id : false;

    // CSS styles as objects or classes
    const containerStyle: CSSProperties = {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '60px 20px',
    };

    const boxStyle: CSSProperties = {
        backgroundColor: '#f9fafb',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        borderRadius: '20px',
        color: '#2c5282',
        padding: '32px',
    };

    const badgeStyle: CSSProperties = {
        display: 'inline-block',
        backgroundColor: 'black',
        color: '#3182ce',
        padding: '4px 10px',
        borderRadius: '12px',
        fontWeight: '600',
        marginBottom: '20px',
    };

    const headingStyle: CSSProperties = {
        fontSize: '1.75rem',
        fontWeight: 700,
        marginBottom: '24px',
    };

    const imageContainerStyle: CSSProperties = {
        width: '100%',
        maxHeight: '400px',
        overflow: 'hidden',
        borderRadius: '8px',
        marginBottom: '20px',
    };

    const imageStyle: CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    };

    const stackStyle: CSSProperties = {
        marginBottom: '16px',
    };

    const labelStyle: CSSProperties = {
        fontWeight: '700',
        marginBottom: '4px',
    };

    const participantListStyle: CSSProperties = {
        listStyleType: 'none',
        paddingLeft: 0,
        margin: 0,
    };

    const participantItemStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        paddingRight: '8px',
    };

    const participantNameStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
    };

    const iconStyle: CSSProperties = {
        marginRight: '6px',
    };

    const buttonStyle = (bgColor: string): CSSProperties => ({
        backgroundColor: bgColor,
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 600,
    });

    const disabledButtonStyle = {
        opacity: 0.6,
        cursor: 'not-allowed',
    };
    if (!user) {
        return <div>Please login to see event details.</div>;
    }



    return (
        <div className="event-details-container" style={containerStyle}>
            <div style={boxStyle}>
                <span style={badgeStyle}>
                    {isOwner ? `Created by ${user.username}` : 'Shared event'}
                </span>

                <h1 style={headingStyle}>{event.title}</h1>

                {event.coverPhoto && (
                    <div style={imageContainerStyle}>
                        <img src={event.coverPhoto} alt={`Cover for ${event.title}`} style={imageStyle} />
                    </div>
                )}

                <div style={stackStyle}>
                    <div style={labelStyle}>Start:</div>
                    <div>{new Date(event.start || '').toLocaleString()}</div>
                </div>

                <div style={stackStyle}>
                    <div style={labelStyle}>End:</div>
                    <div>{new Date(event.end || '').toLocaleString()}</div>
                </div>

                {event.location && (
                    <div style={stackStyle}>
                        <div style={labelStyle}>Location:</div>
                        <div>
                            {[event.location.address, event.location.city, event.location.country]
                                .filter(Boolean)
                                .join(', ')}
                        </div>
                    </div>
                )}

                <div style={stackStyle}>
                    <div style={labelStyle}>Description:</div>
                    <div>{event.description}</div>
                </div>

                {user ? (
                    <div style={stackStyle}>
                        <div style={labelStyle}>Participants:</div>
                        {event.participants && event.participants.length > 0 ? (
                            <ul style={participantListStyle}>
                                {event.participants.map((participant) => (
                                    <li key={participant._id} style={participantItemStyle}>
                                        <div style={participantNameStyle}>
                                            <MdPerson style={iconStyle} />
                                            <span>{participant.username}</span>
                                        </div>

                                        {isOwner && participant._id !== user._id && (
                                            <button
                                                style={buttonStyle('#e53e3e')}
                                                onClick={() => handleRemoveParticipant(participant._id)}
                                            >
                                                Remove
                                            </button>
                                        )}

                                        {participant._id === user._id && (
                                            <button
                                                style={{ ...buttonStyle('#dd6b20'), ...(isLeaving ? disabledButtonStyle : {}) }}
                                                onClick={handleLeaveEvent}
                                                disabled={isLeaving}
                                            >
                                                {isLeaving ? 'Leaving...' : 'Leave'}
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div>No participants yet.</div>
                        )}
                    </div>
                ) : (
                    <div style={stackStyle}>
                        <div style={labelStyle}>Login to see participants and join this event</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EventDetails;
