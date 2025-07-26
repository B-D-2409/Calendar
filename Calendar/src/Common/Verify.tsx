// import { getAuth, sendEmailVerification } from "firebase/auth";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// export default function Verify({ children }) {
//     const [user, setUser] = useState(null);
//     const [isReloading, setIsReloading] = useState(true);
//     const [disabled, setDisabled] = useState(false);
//     const [countdown, setCountdown] = useState(0);
//     const navigate = useNavigate();
//     const auth = getAuth();


//     useEffect(() => {
//         const unsubscribe = auth.onAuthStateChanged((currentUser) => {
//             setUser(currentUser);
//         });
//         return () => unsubscribe();
//     }, []);


//     useEffect(() => {
//         const checkVerification = async () => {
//             if (user) {
//                 await user.reload();
//                 setIsReloading(false);
//             }
//         };
//         checkVerification();
//     }, [user]);


//     useEffect(() => {
//         if (user?.emailVerified) {
//             navigate("/login", { replace: true });
//         }
//     }, [user?.emailVerified, navigate]);


//     useEffect(() => {
//         let timer;
//         if (countdown > 0) {
//             timer = setTimeout(() => {
//                 setCountdown((prev) => prev - 1);
//             }, 1000);
//         } else {
//             setDisabled(false);
//         }
//         return () => clearTimeout(timer);
//     }, [countdown]);


//     const sendEmailVerificationLink = () => {
//         if (user && !disabled) {
//             setDisabled(true);
//             setCountdown(60);
//             sendEmailVerification(user)
//                 .then(() => {
//                     console.log("Email verification sent!");
//                 })
//                 .catch((error) => {
//                     console.error("Error sending email verification:", error);
//                 });
//         }
//     };


//     if (!user || isReloading) {
//         return <div>Loading user data...</div>;
//     }


//     if (!user.emailVerified) {
//         return (
//             <div>
//                 <p>Please confirm your email to continue</p>
//                 <button onClick={sendEmailVerificationLink} disabled={disabled}>
//                     {disabled ? `Please wait ${countdown} seconds` : "Resend Email Verification"}
//                 </button>
//             </div>
//         );
//     }

//     return <div>{children}</div>;
// }
