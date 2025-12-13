"use client";

import { useState } from "react";

export default function ValidateMeter() {
    const [meterNumber, setMeterNumber] = useState("");
    const [status, setStatus] = useState<string | null>(null);

    const handleValidate = async () => {
        try {
            const res = await fetch(`/api/plugins/electricity/validate-meter?meter=${meterNumber}`);
            const data = await res.json();
            setStatus(data.valid ? "Meter is valid ✅" : "Invalid meter ❌");
        } catch (err) {
            console.error(err);
            setStatus("Error validating meter");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Validate Meter</h1>

            <input
                type="text"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="Enter meter number"
                className="border p-2 rounded w-full max-w-sm mb-4"
            />

            <button
                onClick={handleValidate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Validate
            </button>

            {status && <p className="mt-4 font-medium">{status}</p>}
        </div>
    );
}
