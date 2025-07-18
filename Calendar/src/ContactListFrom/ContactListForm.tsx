import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext, AuthContextType } from "../Common/AuthContext";
import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import styles from './ContactsListForm.module.css';

const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

interface User {
    _id: string;
    username: string;
}

interface CreateContactsListFormProps {
    onListCreated: () => void;
}

const CreateContactsListForm: React.FC<CreateContactsListFormProps> = ({ onListCreated }) => {
    const { user, token } = useContext(AuthContext) as AuthContextType;
    const [title, setTitle] = useState<string>("");
    const [success, setSuccess] = useState<boolean>(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [error, setError] = useState<string>("");
    const [currentList, setCurrentList] = useState<any[]>([]);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const addUser = (username: string, id: string) => {
        if (currentList.find((u) => u.id === id)) {
            toast.error("User already added");
            return;
        }
        setCurrentList((prev) => [...prev, { username, id }]);
    };

    const removeUser = (id: string) => {
        const removedUser = currentList.find((u) => u.id === id);
        if (removedUser) {
            setCurrentList((prev) => prev.filter((u) => u.id !== id));
        }
    };

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const response = await axios.get(`${key}/api/auth/users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAllUsers(response.data);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    console.error(err);
                    setError(err.response?.data?.message || "Failed to fetch users.");
                }
            }
        };
        if (token) fetchAllUsers();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?._id) {
            setError("User not authenticated");
            return;
        }

        const contactIds = currentList.map((u) => u.id);

        if (!title) {
            toast.error("Please add title first");
            return;
        }
        if (currentList.length < 1) {
            toast.error("Add at least one user to the list");
            return;
        }

        try {
            const res = await axios.post(
                `${key}/api/contacts`,
                {
                    title,
                    creator: user._id,
                    contacts: contactIds,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setSuccess(true);
            setError("");
            setTitle("");
            setCurrentList([]);

            if (onListCreated) {
                onListCreated();
            }

            toast.success(`${title} has been created`);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                console.error(err);
                setError(err.response?.data?.message || "Failed to create list.");
            } else {
                setError("An unexpected error occurred.");
            }
            setSuccess(false);
        }
    };
    return (
        <div className={styles.primaryContainer}>
            <div className={styles.header}>
                <h2 onClick={() => setIsVisible(!isVisible)} className={styles.title}>
                    Create a Contacts List
                </h2>
                {isVisible ? (
                    <FaMinus onClick={() => setIsVisible(false)} />
                ) : (
                    <FaPlus onClick={() => setIsVisible(true)} />
                )}
            </div>

            {isVisible && (
                <div>
                    {error && <p className={styles.error}>{error}</p>}
                    {success && <p className={styles.success}>List created successfully!</p>}

                    <div className={styles.inputContainer}>
                        <label htmlFor="title" className={styles.label}>
                            List Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            placeholder="e.g. Gym Buddies"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.usersContainer}>
                        {/* All Users */}
                        <div className={styles.allUsers}>
                            <h3 className={styles.subTitle}>All Users</h3>
                            <div className={styles.usersList}>
                                {allUsers.map(
                                    (u) =>
                                        u._id !== user?._id && (
                                            <div
                                                key={u._id}
                                                onClick={() => addUser(u.username, u._id)}
                                                className={styles.user}
                                            >
                                                {u.username}
                                            </div>
                                        )
                                )}
                                {allUsers.length === 0 && (
                                    <p className={styles.noUsers}>No users available</p>
                                )}
                            </div>
                        </div>

                        {/* Selected Users */}
                        <div className={styles.selectedUsers}>
                            <h3 className={styles.subTitle}>Selected Users</h3>
                            <div className={styles.usersList}>
                                {currentList.map((u) => (
                                    <div
                                        key={u._id}
                                        onClick={() => removeUser(u._id)}
                                        className={styles.selectedUser}
                                    >
                                        {u.username}{" "}
                                        <span className={styles.removeText}>(click to remove)</span>
                                    </div>
                                ))}
                                {currentList.length === 0 && (
                                    <p className={styles.noUsers}>No users selected</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.buttonsContainer}>
                        <button onClick={handleSubmit} className={styles.submitButton}>
                            Create List
                        </button>
                        <button
                            onClick={() => setCurrentList([])}
                            className={styles.clearButton}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
            <ToastContainer />
        </div>
    );
};

export default CreateContactsListForm;
