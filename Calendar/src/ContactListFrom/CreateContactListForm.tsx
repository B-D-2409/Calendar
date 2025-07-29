/**
 * @file CreateContactsListForm.tsx
 * @description A React component for creating a new contacts list.
 *              Users can add/remove contacts from the list and submit it to the backend.
 */

import React, { useState, useContext, useEffect, FormEvent } from "react";
import axios from "axios";
import { AuthContext, AuthContextType } from "../Common/AuthContext";
import { FaPlus, FaMinus } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import styles from "./ContactsListForm.module.css";

const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

interface User {
    _id: string;
    username: string;
}

interface CurrentUser {
    id: string;
    username: string;
}

interface CreateContactsListFormProps {
      /**
     * Callback fired when a new contacts list is successfully created.
     */
    onListCreated: () => void;
}
/**
 * React component that renders a form to create a contacts list.
 * Allows users to select multiple contacts from all users and submit the list.
 * 
 * @param {CreateContactsListFormProps} props - Component props.
 * @returns {JSX.Element} The contacts list creation form.
 */
export const CreateContactsListForm: React.FC<CreateContactsListFormProps> = ({ onListCreated }) => {
    const { user, token } = useContext(AuthContext) as AuthContextType;
    const [title, setTitle] = useState<string>("");
    const [success, setSuccess] = useState<boolean>(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [error, setError] = useState<string>("");
    const [currentList, setCurrentList] = useState<CurrentUser[]>([]);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    /**
     * @function addUser
     * @description Adds a user to the current contacts list.
     */
    const addUser = (username: string, id: string) => {
        if (currentList.find((u) => u.id === id)) {
            toast.error("User already added");
            return;
        }
        setCurrentList((prev) => [...prev, { username, id }]);
    };

    /**
     * @function removeUser
     * @description Removes a user from the current contacts list.
     */
    const removeUser = (id: string) => {
        setCurrentList((prev) => prev.filter((u) => u.id !== id));
    };

    /**
     * @function fetchAllUsers
     * @description Fetches all users from the backend.
     */
    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const response = await axios.get<User[]>(`${key}/api/auth/users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAllUsers(response.data);
            } catch (err: any) {
                console.error("Error fetching contacts:", err.response?.data || err);
            }
        };
        if (token) fetchAllUsers();
    }, [token]);

    /**
     * @function handleSubmit
     * @description Handles form submission to create a new contacts list.
     */
    const handleSubmit = async (e: FormEvent) => {
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
            await axios.post(
                `${key}/api/contacts`,
                { title, creator: user._id, contacts: contactIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(true);
            setError("");
            setTitle("");
            setCurrentList([]);
            onListCreated();
            toast.success(`${title} has been created`);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create list.");
            setSuccess(false);
        }
    };

    return (
        <div className={styles.primaryContainer}>
            <div className={styles.headerRow}>
                <h2 className={styles.title} onClick={() => setIsVisible(!isVisible)}>
                    Create a Contacts List
                </h2>
                {isVisible ? (
                    <FaMinus onClick={() => setIsVisible(false)} className={styles.icon} />
                ) : (
                    <FaPlus onClick={() => setIsVisible(true)} className={styles.icon} />
                )}
            </div>

            {isVisible && (
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <p className={styles.error}>{error}</p>}
                    {success && <p className={styles.success}>List created successfully!</p>}

                    <div className={styles.inputGroup}>
                        <label htmlFor="title">List Title</label>
                        <input
                            id="title"
                            type="text"
                            placeholder="e.g. Gym Buddies"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.usersContainer}>
                        <div className={styles.allUsers}>
                            <h3>All Users</h3>
                            <div className={styles.userList}>
                                {allUsers
                                    .filter((u) => u._id !== user?._id)
                                    .map((u) => (
                                        <div key={u._id} onClick={() => addUser(u.username, u._id)} className={styles.userItem}>
                                            {u.username}
                                        </div>
                                    ))}
                                {allUsers.length === 0 && <p>No users available</p>}
                            </div>
                        </div>

                        <div className={styles.selectedUsers}>
                            <h3>Selected Users</h3>
                            <div className={styles.userList}>
                                {currentList.map((u) => (
                                    <div key={u.id} onClick={() => removeUser(u.id)} className={styles.userItem}>
                                        {u.username} <span>(click to remove)</span>
                                    </div>
                                ))}
                                {currentList.length === 0 && <p>No users selected</p>}
                            </div>
                        </div>
                    </div>

                    <div className={styles.buttons}>
                        <button type="submit" className={styles.submitButton}>
                            Create List
                        </button>
                        <button type="button" onClick={() => setCurrentList([])} className={styles.clearButton}>
                            Clear
                        </button>
                    </div>
                </form>
            )}
            <ToastContainer />
        </div>
    );
};

export default CreateContactsListForm;
