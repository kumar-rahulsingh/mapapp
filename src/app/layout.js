import React from "react";
import "./globals.css"; // Import your global CSS

export const metadata = {
  title: "Hex Map Viewer", // Page Title
  description: "Interactive map with H3 hexagons", // Page Description
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* You can add a wrapper component here if needed */}
        {children}
      </body>
    </html>
  );
}
