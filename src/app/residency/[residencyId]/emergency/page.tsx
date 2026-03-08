"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTriggerEmergencyResident } from "@/hooks/use-emergency";
import { TriggerEmergencyModal } from "@/components/emergencies/TriggerEmergencyModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle, ShieldAlert, Phone } from "lucide-react";
import { TriggerEmergencyRequest } from "@/types";

export default function ResidentEmergencyPage() {
    const params = useParams<{ residencyId: string }>();
    const residencyId = params?.residencyId;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [triggered, setTriggered] = useState(false);

    const trigger = useTriggerEmergencyResident();

    const handleTrigger = (data: TriggerEmergencyRequest) => {
        trigger.mutate(
            { ...data, residency_id: residencyId ?? null },
            {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setTriggered(true);
                },
            }
        );
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                    Emergency Alert
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Use this only in a genuine emergency. Security and key community
                    personnel will be notified immediately.
                </p>
            </div>

            {triggered ? (
                <Card className="border-green-300 bg-green-50">
                    <CardContent className="p-6 text-center space-y-2">
                        <ShieldAlert className="w-10 h-10 text-green-600 mx-auto" />
                        <h2 className="text-lg font-semibold text-green-800">
                            Alert Sent
                        </h2>
                        <p className="text-sm text-green-700">
                            Security and community personnel have been notified. Help is on
                            the way. Stay calm and stay safe.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setTriggered(false)}
                        >
                            Trigger Another Alert
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-red-800">
                                        Before triggering an alert:
                                    </p>
                                    <ul className="text-sm text-red-700 mt-1 list-disc list-inside space-y-1">
                                        <li>Call emergency services (911) if life is in danger</li>
                                        <li>Move to a safe location if possible</li>
                                        <li>This alert notifies on-site security immediately</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        size="lg"
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-base py-4"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Trigger Emergency Alert
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                        <Phone className="w-4 h-4" />
                        <span>For life-threatening emergencies, call 911 first.</span>
                    </div>
                </>
            )}

            <TriggerEmergencyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleTrigger}
                isLoading={trigger.isPending}
                residencyId={residencyId}
            />
        </div>
    );
}
