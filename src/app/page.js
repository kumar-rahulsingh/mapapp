"use client";

import { useState } from "react";
import MapDetails from "./components/MapDetails";


export default function Home() {
  const [hexDetails, setHexDetails] = useState([]);

  return (
    <div>
      <MapDetails setHexDetails={setHexDetails} />
    </div>
  );
}
