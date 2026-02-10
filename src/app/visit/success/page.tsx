"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function VisitSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [reference, setReference] = useState<string | null>(null);

    useEffect(() => {
        const ref = searchParams?.get("reference");
        if (ref) {
            setReference(ref);
        }
    }, [searchParams]);

    return (
        <AuthLayout
            title="Visit Request Submitted"
            description="Your appointment request has been sent successfully"
        >
            <div className="space-y-6">
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex justify-center"
                >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                </motion.div>

                {/* Success Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-2"
                >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Request Submitted Successfully!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your visit request has been sent to the resident for approval.
                    </p>
                </motion.div>

                {/* Reference Card */}
                {reference && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-2 border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10">
                            <CardContent className="p-6">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                        Reference Number
                                    </p>
                                    <p className="text-lg font-mono font-bold text-gray-900 dark:text-white break-all">
                                        {reference}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                        Please save this reference number for your records
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Next Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4"
                >
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        What happens next?
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                        <li className="flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>The resident will be notified of your visit request</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>You&apos;ll receive an email confirmation once your request is reviewed</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>If approved, you&apos;ll receive visit details and access instructions</span>
                        </li>
                    </ul>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3 pt-4"
                >
                    <Button
                        onClick={() => router.push("/visit")}
                        className="w-full h-12 text-base font-semibold"
                    >
                        Submit Another Request
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                        onClick={() => {
                            const domain = process.env.NEXT_APP_DOMAIN || "vmscore.to";
                            window.location.href = `https://dashboard.${domain}/select`;
                        }}
                        variant="outline"
                        className="w-full h-12 text-base font-semibold"
                    >
                        <Home className="mr-2 h-5 w-5" />
                        Go to Home
                    </Button>
                </motion.div>

                {/* Contact Support */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Have questions? Contact the residency management for assistance.
                    </p>
                </motion.div>
            </div>
        </AuthLayout>
    );
}
