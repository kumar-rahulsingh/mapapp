"use client";

import { useState } from "react";
import HexMap from "./components/HexMap";
// import HexDetails from "./components/HexDetails";

export default function Home() {
  const [hexDetails, setHexDetails] = useState([]);

  return (
    <div>
      <HexMap setHexDetails={setHexDetails} />
      {/* {hexDetails.length > 0 ? (
        hexDetails.map((hex, index) => <HexDetails key={index} hex={hex} />)
      ) : (
        <div>No hex selected</div>
      )} */}
    </div>
  );
}
