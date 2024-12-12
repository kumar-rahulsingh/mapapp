"use client";

import React, { useState, useCallback } from "react";
import Map, { Source, Layer, Popup } from "react-map-gl";
import { latLngToCell, cellToBoundary, getIcosahedronFaces, getBaseCellNumber, isPentagon, cellArea } from "h3-js";

const HexMap = ({ setHexDetails }) => {
    const [viewport, setViewport] = useState({
        latitude: 37.7749,
        longitude: -122.4194,
        zoom: 10,
    });
    const [hexes, setHexes] = useState([]);
    const [selectedHexSizes, setSelectedHexSizes] = useState([7]); // Default resolution
    const [selectedHexes, setSelectedHexes] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v11"); // Default map style
    const [popupInfo, setPopupInfo] = useState(null); // Holds info to display in the popup

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    // Handle multiple hex size selection
    const handleHexSizeChange = (event) => {
        const selectedSizes = Array.from(event.target.selectedOptions, (option) => parseInt(option.value));
        setSelectedHexSizes(selectedSizes);
        setIsDropdownOpen(false); // Close the dropdown after selection
    };

    // Draw hexagons for selected sizes
    const drawHexagons = useCallback(
        (bounds) => {
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();

            const swLat = sw.lat;
            const swLng = sw.lng;
            const neLat = ne.lat;
            const neLng = ne.lng;

            let hexagons = [];
            selectedHexSizes.forEach((size) => {
                for (let lat = swLat; lat <= neLat; lat += 0.1) {
                    for (let lng = swLng; lng <= neLng; lng += 0.1) {
                        const hexIndex = latLngToCell(lat, lng, size);
                        hexagons.push(hexIndex);
                    }
                }
            });
            setHexes([...new Set(hexagons)]); // Remove duplicates
        },
        [selectedHexSizes]
    );

    const onMapMove = (event) => {
        const mapBounds = event.target.getBounds();
        drawHexagons(mapBounds);
    };

    const handleMapClick = (event) => {
        const { lat, lng } = event.lngLat;
        if (!lat || !lng) return;

        // Ensure lat/lng are valid before passing to latLngToCell
        if (isNaN(lat) || isNaN(lng)) return;

        // Convert click coordinates to hex index based on the selected size
        const hexIndex = latLngToCell(lat, lng, selectedHexSizes[0]); // Use the first selected size for simplicity

        // Get Icosahedron Faces, Base Cell, Boundary Vertices, and Pentagon status
        const faces = getIcosahedronFaces(hexIndex); // Get Icosahedron Face IDs
        const boundaryVerts = cellToBoundary(hexIndex); // Get Boundary Vertices
        const baseCell = getBaseCellNumber(hexIndex); // Get Base cell number using the correct method
        const isPent = isPentagon(hexIndex); // Check if it's a Pentagon

        // Calculate the area of the cell in square kilometers (or any other unit you prefer)
        const areaInKm2 = cellArea(hexIndex, "km2"); // Use "m2", "km2", or "mi2" for different units

        // Show popup with all relevant details
        setPopupInfo({
            lat,
            lng,
            hexIndex, // Add hexIndex here
            faces,
            numBoundaryVerts: boundaryVerts.length, // Number of Boundary Vertices
            baseCell,
            isPentagon: isPent ? "Yes" : "No", // Pentagon status
            area: areaInKm2, // Display the area
        });

        // Toggle the selected hex (remove it if it's already selected, add it if it's not)
        setSelectedHexes((prev) => {
            const hexExists = prev.some((hex) => hex.hexIndex === hexIndex);
            if (hexExists) {
                return prev.filter((hex) => hex.hexIndex !== hexIndex);
            } else {
                const newHex = { hexIndex, lat, lng, faces, numBoundaryVerts: boundaryVerts.length, baseCell, isPentagon: isPent, areaInKm2 };
                return [...prev, newHex];
            }
        });

        // Update hex details
        setHexDetails((prev) => {
            const hexExists = prev.some((hex) => hex.hexIndex === hexIndex);
            if (hexExists) {
                return prev.filter((hex) => hex.hexIndex !== hexIndex);
            } else {
                const newHex = { hexIndex, lat, lng, faces, numBoundaryVerts: boundaryVerts.length, baseCell, isPentagon: isPent, areaInKm2 };
                return [...prev, newHex];
            }
        });
    };

    // Toggle map style (Satellite / Basic)
    const toggleMapStyle = () => {
        setMapStyle((prevStyle) =>
            prevStyle === "mapbox://styles/mapbox/streets-v11" ? "mapbox://styles/mapbox/satellite-streets-v11" : "mapbox://styles/mapbox/streets-v11"
        );
    };

    return (
        <div className="relative w-full h-screen">
            {/* Navbar */}
            <nav className="bg-gray-800 p-4 shadow-md z-20">
                <div className="flex justify-between items-center text-white">
                    <div className="text-xl font-semibold">Hex Map</div>

                    {/* Hex Size Button */}
                    <button
                        className="bg-blue-500 p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                    >
                        Select Hex Size
                    </button>

                    {/* Map Style Toggle Button */}
                    <button
                        className="bg-green-500 p-2 rounded-md text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                        onClick={toggleMapStyle}
                    >
                        Toggle Satellite View
                    </button>
                </div>
            </nav>

            {/* Hex Size Dropdown */}
            {isDropdownOpen && (
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white p-4 shadow-lg rounded-md w-48 z-30 overflow-hidden">
                    <label htmlFor="hex-size" className="block text-lg font-medium text-gray-700 mb-2">
                        Choose Hex Sizes:
                    </label>
                    <select
                        id="hex-size"
                        multiple
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleHexSizeChange}
                    >
                        <option value={3}>Size 3</option>
                        <option value={4}>Size 4</option>
                        <option value={5}>Size 5</option>
                        <option value={6}>Size 6</option>
                        <option value={7}>Size 7</option>
                        <option value={8}>Size 8</option>
                    </select>
                </div>
            )}

            {/* Main Layout */}
            <div className="flex h-full">
                {/* Map Section */}
                <div className="w-2/3 h-full">
                    <Map
                        initialViewState={viewport}
                        style={{ width: "100%", height: "100%" }}
                        mapStyle={mapStyle} // Dynamically changing map style
                        mapboxAccessToken={mapboxToken}
                        onMoveEnd={onMapMove}
                        onClick={handleMapClick}
                    >
                        <Source
                            id="hexes"
                            type="geojson"
                            data={{
                                type: "FeatureCollection",
                                features: hexes.map((hex) => ({
                                    type: "Feature",
                                    geometry: {
                                        type: "Polygon",
                                        coordinates: [cellToBoundary(hex, true)],
                                    },
                                    properties: {},
                                })),
                            }}
                        >
                            <Layer
                                id="hex-layer"
                                type="fill"
                                paint={{
                                    "fill-color": "#088",
                                    "fill-opacity": 0.4,
                                }}
                            />
                        </Source>

                        {/* Display selected hexes */}
                        {selectedHexes.map((hex, index) => (
                            <Source
                                key={index}
                                id={`selected-hex-${index}`}
                                type="geojson"
                                data={{
                                    type: "FeatureCollection",
                                    features: [
                                        {
                                            type: "Feature",
                                            geometry: {
                                                type: "Polygon",
                                                coordinates: [cellToBoundary(hex.hexIndex, true)],
                                            },
                                            properties: {},
                                        },
                                    ],
                                }}
                            >
                                <Layer
                                    id={`selected-hex-layer-${index}`}
                                    type="line"
                                    paint={{
                                        "line-color": "#f00", // Red color for selected hex
                                        "line-width": 3,
                                    }}
                                />
                            </Source>
                        ))}
                    </Map>
                </div>

                {/* Hex Details Section */}
                <div className="w-1/3 p-4 bg-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Hex Details</h2>
                    {popupInfo ? (
                        <div>
                            <p className="text-sm text-gray-800">
                                <strong>Lat./Lng.:</strong> {popupInfo.lat.toFixed(5)}, {popupInfo.lng.toFixed(5)}
                            </p>
                            <p className="text-sm text-gray-800"><strong>Hex Index:</strong> {popupInfo.hexIndex}</p>
                            <p className="text-sm text-gray-800"><strong>Area:</strong> {popupInfo.area.toFixed(2)} km²</p>
                            <p className="text-sm text-gray-800"><strong>Base Cell:</strong> {popupInfo.baseCell}</p>
                            <p className="text-sm text-gray-800"><strong>Is Pentagon:</strong> {popupInfo.isPentagon}</p>
                            <p className="text-sm text-gray-800"><strong>Number of Boundary Vertices:</strong> {popupInfo.numBoundaryVerts}</p>


                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">Click on a hex to see details</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HexMap;
