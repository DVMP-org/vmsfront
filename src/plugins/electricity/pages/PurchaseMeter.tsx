"use client";

import { useState } from "react";

export default function PurchaseMeter() {
    const [meterNumber, setMeterNumber] = useState("");
    const [amount, setAmount] = useState < number > (0);
    const [message, setMessage] = useState < string | null > (null);

    const handlePurchase = async () => {
        try {
            const res = await fetch(`/api/plugins/electricity/purchase`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meterNumber, amount })
            });
            const data = await res.json();
            setMessage(data.success ? `Purchase successful! Ref: ${data.ref}` : "Purchase failed");
        } catch (err) {
            console.error(err);
            setMessage("Error during purchase");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Purchase Electricity</h1>

            <div className="mb-4">
                <input
                    type="text"
                    value={meterNumber}
                    onChange={(e) => setMeterNumber(e.target.value)}
                    placeholder="Enter meter number"
                    className="border p-2 rounded w-full max-w-sm mb-2"
                />
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                    className="border p-2 rounded w-full max-w-sm"
                />
            </div>

            <button
                onClick={handlePurchase}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
                Purchase
            </button>

            {message && <p className="mt-4 font-medium">{message}</p>}
        </div>
    );
}
