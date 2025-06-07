// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/style.css";

// Tidak perlu membungkus di sini jika sudah dibungkus di App.jsx
// Tapi jika ingin, bisa juga seperti ini:
// import { LanguageProvider } from "./context/LanguageContext.jsx";
// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <LanguageProvider>
//       <App />
//     </LanguageProvider>
//   </React.StrictMode>
// );

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App /> {/* App sudah membungkus dirinya dengan LanguageProvider */}
  </React.StrictMode>
);
