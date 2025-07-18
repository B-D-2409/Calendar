import { SiTypescript } from 'react-icons/si';
import React from "react";
import styles from "./AboutPage.module.css";
import { FaReact, FaNodeJs, FaDatabase } from "react-icons/fa";
import {
    SiJavascript,
    SiChakraui,
    SiExpress,
    SiMongodb,
    SiReact,
} from "react-icons/si";

function AboutPage() {
    return (
        <div className={styles.primaryContainer}>
            {/* Header Section */}
            <div className={styles.headerSection}>
                <h1 className={styles.mainHeading}> Calendar</h1>
                <p className={styles.subHeading}>
                    (day) and Latin "Calendar" (calendar)
                </p>
            </div>

            <hr className={styles.divider} />

            {/* About The Platform */}
            <div className={styles.section}>
                <h2 className={styles.sectionHeading}>About Our Platform</h2>
                <p className={styles.paragraph}>
                    My platform is designed to help you manage your events and contacts
                    effectively. Whether you're planning a meeting, scheduling a
                    conference, or organizing a social gathering, our platform provides the
                    tools you need to stay organized and connected.
                </p>
            </div>

            {/* Tech Stack */}
            <div className={styles.section}>
                <h2 className={styles.sectionHeading}>Technology Stack</h2>
                <div className={styles.techStackContainer}>
                    <div className={styles.techStackBoxFrontend}>
                        <h3 className={styles.techStackBoxHeading}>Frontend</h3>
                        <ul className={styles.techList}>
                            <li>
                                <FaReact /> React
                            </li>
                            <li>
                                <SiJavascript /> JavaScript
                            </li>
                            <li>
                                <SiTypescript /> TypeScript
                            </li>
                            <li>
                                <SiReact /> React Icons
                            </li>
                        </ul>
                    </div>

                    <div className={styles.techStackBoxBackend}>
                        <h3 className={styles.techStackBoxHeading}>Backend</h3>
                        <ul className={styles.techList}>
                            <li>
                                <SiMongodb /> MongoDB
                            </li>
                            <li>
                                <FaNodeJs /> Node.js
                            </li>
                            <li>
                                <SiExpress /> Express
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Key Features */}
            <div className={styles.section}>
                <h2 className={styles.sectionHeading}>Key Features</h2>
                <div className={styles.featuresContainer}>
                    <div className={styles.featureBox}>
                        <h3>Public & Private Sections</h3>
                        <p>
                            Browse public events without an account, or register/login to
                            access full platform functionality.
                        </p>
                    </div>

                    <div className={styles.featureBox}>
                        <h3>Comprehensive Calendar</h3>
                        <p>
                            View your events in multiple formats: Monthly, Weekly, Work Week,
                            and Daily views with hourly scheduling.
                        </p>
                        <div className={styles.calendarTypes}>
                            <span className={styles.monthly}>Monthly</span>
                            <span className={styles.weekly}>Weekly</span>
                            <span className={styles.workweek}>Work Week</span>
                            <span className={styles.daily}>Daily</span>
                        </div>
                    </div>

                    <div className={styles.featureBox}>
                        <h3>Event & Series Management</h3>
                        <p>
                            Create one-time events or recurring series. Invite others to
                            participate, edit details, and manage participants.
                        </p>
                    </div>

                    <div className={styles.featureBox}>
                        <h3>Contact Management</h3>
                        <p>
                            Add contacts to your list, create specialized contact groups, and
                            easily invite them to your events.
                        </p>
                    </div>

                    <div className={styles.featureBox}>
                        <h3>User Preferences</h3>
                        <p>
                            Customize your experience including invitation preferences and
                            notification settings.
                        </p>
                    </div>

                    <div className={styles.featureBox}>
                        <h3>Search Functionality</h3>
                        <p>
                            Quickly find events, contacts, and other information with our
                            comprehensive search feature.
                        </p>
                    </div>
                    <div className={styles.featureBox}>
                        <h3>Admin Panel</h3>
                        <p>
                            Administrators can manage users and events from a centralized
                            dashboard with powerful search and filtering capabilities.
                        </p>
                    </div>
                </div>
            </div>

            <hr className={styles.divider} />
            <div className={styles.section}>
                <h2 className={styles.sectionHeading}></h2>
                <div className={styles.teamContainer}>
                    <div className={styles.teamMember}>
                        <h3>Bobi</h3>
                        <a
                            href="https://github.com/B-D-2409"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub Profile
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutPage;
