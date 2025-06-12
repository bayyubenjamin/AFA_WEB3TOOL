// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // <-- IMPORT INI
import App from "./App.jsx";
import "./styles/style.css";

// [EDIT]: Impor kedua provider
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* BUNGKUS APP DENGAN BROWSERROUTER */}
    <BrowserRouter>
      {/* [EDIT]: Bungkus App dengan kedua Provider */}
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
