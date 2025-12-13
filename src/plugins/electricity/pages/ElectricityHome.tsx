"use client";

import Link from "next/link";

export default function ElectricityHome() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Electricity Purchase</h1>
            <p className="mb-6">
                Welcome! From here, residents can validate meters and purchase electricity for their houses.
            </p>

            <div className="space-x-4">
                <Link
                    href="/electricity/validate"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Validate Meter
                </Link>

                <Link
                    href="/electricity/purchase"
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Purchase Electricity
                </Link>
            </div>
        </div>
    );
}
