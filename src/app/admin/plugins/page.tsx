"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Puzzle,
  Search,
  Sparkles,
  Shield,
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  BarChart3,
  Users,
  Zap,
  X,
  Settings,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  Save,
} from "lucide-react";

// Plugin configuration types
interface PluginConfig {
  [key: string]: any;
}

interface PluginDetails {
  useCases: string[];
  setupSteps: string[];
  requirements: string[];
  configOptions: {
    key: string;
    label: string;
    type: "text" | "toggle" | "select" | "number";
    description: string;
    defaultValue?: any;
    options?: string[];
  }[];
}

// Plugin type definition
interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  category: string;
  imageUrl: string;
  color: string;
  details: PluginDetails;
  config: PluginConfig;
}

// Mock plugin data with detailed information
const initialPlugins: Plugin[] = [
  {
    id: "1",
    name: "Security Camera",
    description:
      "Integrate with security camera systems to monitor gate access in real-time",
    icon: Shield,
    enabled: true,
    category: "Security",
    imageUrl: "/api/placeholder/400/300",
    color: "from-blue-500/20 to-blue-600/20",
    details: {
      useCases: [
        "Monitor all gate entry and exit points with live video feeds",
        "Record visitor arrivals for security audits",
        "Automatically capture images when gate passes are scanned",
        "Review historical footage of gate events",
      ],
      setupSteps: [
        "Connect your camera system's API endpoint",
        "Configure camera zones for each gate location",
        "Set up recording schedules and retention policies",
        "Test camera integration with a sample gate event",
      ],
      requirements: [
        "IP-enabled security camera system",
        "Camera API credentials",
        "Network access to camera system",
        "Minimum 10 Mbps upload bandwidth",
      ],
      configOptions: [
        {
          key: "apiEndpoint",
          label: "Camera API Endpoint",
          type: "text",
          description: "URL of your camera system's API",
          defaultValue: "https://cameras.example.com/api",
        },
        {
          key: "recordOnScan",
          label: "Auto-record on gate scan",
          type: "toggle",
          description:
            "Automatically start recording when a gate pass is scanned",
          defaultValue: true,
        },
        {
          key: "retentionDays",
          label: "Video Retention (days)",
          type: "number",
          description: "Number of days to keep recorded footage",
          defaultValue: 30,
        },
        {
          key: "quality",
          label: "Video Quality",
          type: "select",
          description: "Recording quality setting",
          options: ["Low", "Medium", "High", "Ultra"],
          defaultValue: "High",
        },
      ],
    },
    config: {
      apiEndpoint: "https://cameras.example.com/api",
      recordOnScan: true,
      retentionDays: 30,
      quality: "High",
    },
  },
  {
    id: "2",
    name: "Email Notifications",
    description:
      "Send automated email notifications to residents about visitors and gate events",
    icon: Mail,
    enabled: true,
    category: "Communication",
    imageUrl: "/api/placeholder/400/300",
    color: "from-purple-500/20 to-purple-600/20",
    details: {
      useCases: [
        "Notify residents when their visitors arrive at the gate",
        "Send daily summaries of gate activity to house owners",
        "Alert admins about unusual gate events or system issues",
        "Share community announcements via email",
      ],
      setupSteps: [
        "Configure your SMTP server settings",
        "Customize email templates for different event types",
        "Set notification preferences for residents",
        "Test email delivery with a sample notification",
      ],
      requirements: [
        "SMTP server or email service (e.g., SendGrid, Amazon SES)",
        "Valid sender email address",
        "Email service API credentials",
      ],
      configOptions: [
        {
          key: "smtpHost",
          label: "SMTP Host",
          type: "text",
          description: "Your SMTP server hostname",
          defaultValue: "smtp.gmail.com",
        },
        {
          key: "smtpPort",
          label: "SMTP Port",
          type: "number",
          description: "SMTP server port",
          defaultValue: 587,
        },
        {
          key: "senderEmail",
          label: "Sender Email",
          type: "text",
          description: "Email address used to send notifications",
          defaultValue: "noreply@vms.com",
        },
        {
          key: "notifyOnVisitor",
          label: "Notify on visitor arrival",
          type: "toggle",
          description: "Send email when visitor checks in",
          defaultValue: true,
        },
      ],
    },
    config: {
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      senderEmail: "noreply@vms.com",
      notifyOnVisitor: true,
    },
  },
  {
    id: "3",
    name: "SMS Alerts",
    description:
      "Send SMS notifications for important gate events and visitor arrivals",
    icon: MessageSquare,
    enabled: false,
    category: "Communication",
    imageUrl: "/api/placeholder/400/300",
    color: "from-green-500/20 to-green-600/20",
    details: {
      useCases: [
        "Instant SMS alerts when visitors arrive at your gate",
        "Emergency notifications for security breaches",
        "Gate pass expiration reminders",
        "Quick delivery and service provider notifications",
      ],
      setupSteps: [
        "Sign up for an SMS service provider (Twilio, SNS)",
        "Add your SMS API credentials",
        "Configure phone number formats and country codes",
        "Set up message templates and triggers",
      ],
      requirements: [
        "SMS service provider account (e.g., Twilio)",
        "API credentials and authentication token",
        "Valid phone numbers for residents",
      ],
      configOptions: [
        {
          key: "provider",
          label: "SMS Provider",
          type: "select",
          description: "Choose your SMS service provider",
          options: ["Twilio", "AWS SNS", "Vonage", "Custom"],
          defaultValue: "Twilio",
        },
        {
          key: "apiKey",
          label: "API Key",
          type: "text",
          description: "Your SMS provider API key",
          defaultValue: "",
        },
        {
          key: "senderNumber",
          label: "Sender Phone Number",
          type: "text",
          description: "Phone number for sending SMS",
          defaultValue: "+1234567890",
        },
        {
          key: "emergencyOnly",
          label: "Emergency alerts only",
          type: "toggle",
          description: "Only send SMS for emergency situations",
          defaultValue: false,
        },
      ],
    },
    config: {
      provider: "Twilio",
      apiKey: "",
      senderNumber: "+1234567890",
      emergencyOnly: false,
    },
  },
  {
    id: "4",
    name: "Push Notifications",
    description: "Real-time push notifications for mobile app users",
    icon: Bell,
    enabled: true,
    category: "Communication",
    imageUrl: "/api/placeholder/400/300",
    color: "from-amber-500/20 to-amber-600/20",
    details: {
      useCases: [
        "Instant mobile alerts for visitor arrivals",
        "Real-time gate event notifications",
        "Community announcement broadcasts",
        "Personalized alerts based on user preferences",
      ],
      setupSteps: [
        "Configure Firebase Cloud Messaging (FCM) or similar",
        "Add push notification credentials",
        "Customize notification sounds and appearance",
        "Set up notification categories and priorities",
      ],
      requirements: [
        "Firebase project or Apple Push Notification service",
        "Mobile app with push notification support",
        "Valid server credentials",
      ],
      configOptions: [
        {
          key: "fcmServerKey",
          label: "FCM Server Key",
          type: "text",
          description: "Firebase Cloud Messaging server key",
          defaultValue: "",
        },
        {
          key: "soundEnabled",
          label: "Enable notification sounds",
          type: "toggle",
          description: "Play sound with notifications",
          defaultValue: true,
        },
        {
          key: "priority",
          label: "Default Priority",
          type: "select",
          description: "Default notification priority level",
          options: ["Low", "Normal", "High", "Urgent"],
          defaultValue: "Normal",
        },
      ],
    },
    config: {
      fcmServerKey: "",
      soundEnabled: true,
      priority: "Normal",
    },
  },
  {
    id: "5",
    name: "Event Calendar",
    description: "Manage community events and sync with resident calendars",
    icon: Calendar,
    enabled: false,
    category: "Productivity",
    imageUrl: "/api/placeholder/400/300",
    color: "from-pink-500/20 to-pink-600/20",
    details: {
      useCases: [
        "Schedule and manage community events",
        "Sync events with Google Calendar, Outlook, or iCal",
        "Send event reminders to residents",
        "Track RSVPs and attendance",
      ],
      setupSteps: [
        "Connect calendar service (Google Calendar API)",
        "Configure event creation permissions",
        "Set up automatic reminder schedules",
        "Customize event categories and templates",
      ],
      requirements: [
        "Google Calendar API access or similar",
        "Calendar sync credentials",
        "Event management permissions",
      ],
      configOptions: [
        {
          key: "calendarService",
          label: "Calendar Service",
          type: "select",
          description: "Primary calendar integration",
          options: ["Google Calendar", "Outlook", "iCal", "Custom"],
          defaultValue: "Google Calendar",
        },
        {
          key: "autoSync",
          label: "Auto-sync events",
          type: "toggle",
          description: "Automatically sync events to resident calendars",
          defaultValue: true,
        },
        {
          key: "reminderHours",
          label: "Reminder (hours before)",
          type: "number",
          description: "Send reminders this many hours before event",
          defaultValue: 24,
        },
      ],
    },
    config: {
      calendarService: "Google Calendar",
      autoSync: true,
      reminderHours: 24,
    },
  },
  {
    id: "6",
    name: "Document Manager",
    description: "Store and share important community documents and files",
    icon: FileText,
    enabled: true,
    category: "Productivity",
    imageUrl: "/api/placeholder/400/300",
    color: "from-indigo-500/20 to-indigo-600/20",
    details: {
      useCases: [
        "Store community bylaws and regulations",
        "Share meeting minutes and reports",
        "Manage resident document submissions",
        "Version control for important documents",
      ],
      setupSteps: [
        "Configure document storage location (cloud or local)",
        "Set up folder structure and permissions",
        "Define file size limits and allowed formats",
        "Configure access controls for different user roles",
      ],
      requirements: [
        "Cloud storage account (AWS S3, Google Cloud Storage) or local storage",
        "Adequate storage space",
        "File upload/download bandwidth",
      ],
      configOptions: [
        {
          key: "storageProvider",
          label: "Storage Provider",
          type: "select",
          description: "Where to store documents",
          options: ["AWS S3", "Google Cloud Storage", "Azure Blob", "Local"],
          defaultValue: "AWS S3",
        },
        {
          key: "maxFileSize",
          label: "Max file size (MB)",
          type: "number",
          description: "Maximum file size for uploads",
          defaultValue: 25,
        },
        {
          key: "versionControl",
          label: "Enable version control",
          type: "toggle",
          description: "Keep previous versions of documents",
          defaultValue: true,
        },
      ],
    },
    config: {
      storageProvider: "AWS S3",
      maxFileSize: 25,
      versionControl: true,
    },
  },
  {
    id: "7",
    name: "Advanced Analytics",
    description:
      "Get detailed insights into visitor patterns and gate usage statistics",
    icon: BarChart3,
    enabled: true,
    category: "Analytics",
    imageUrl: "/api/placeholder/400/300",
    color: "from-cyan-500/20 to-cyan-600/20",
    details: {
      useCases: [
        "Analyze peak visitor times and traffic patterns",
        "Generate monthly gate usage reports",
        "Track resident activity and engagement",
        "Identify security trends and anomalies",
      ],
      setupSteps: [
        "Enable data collection for analytics",
        "Configure reporting schedules",
        "Customize dashboard widgets and metrics",
        "Set up automated report generation",
      ],
      requirements: [
        "Database access for historical data",
        "Permission to access gate event logs",
        "Sufficient storage for analytics data",
      ],
      configOptions: [
        {
          key: "dataRetention",
          label: "Data retention (months)",
          type: "number",
          description: "Months of data to keep for analytics",
          defaultValue: 12,
        },
        {
          key: "autoReports",
          label: "Auto-generate reports",
          type: "toggle",
          description: "Automatically generate monthly reports",
          defaultValue: true,
        },
        {
          key: "reportFormat",
          label: "Report Format",
          type: "select",
          description: "Preferred report file format",
          options: ["PDF", "Excel", "CSV", "JSON"],
          defaultValue: "PDF",
        },
      ],
    },
    config: {
      dataRetention: 12,
      autoReports: true,
      reportFormat: "PDF",
    },
  },
  {
    id: "8",
    name: "Community Directory",
    description:
      "Searchable directory of all residents and their contact information",
    icon: Users,
    enabled: false,
    category: "Community",
    imageUrl: "/api/placeholder/400/300",
    color: "from-rose-500/20 to-rose-600/20",
    details: {
      useCases: [
        "Quick lookup of resident contact information",
        "Emergency contact directory for security",
        "Community member profiles with photos",
        "Export directory for administrative purposes",
      ],
      setupSteps: [
        "Import existing resident data",
        "Configure privacy settings and permissions",
        "Set up profile fields and visibility options",
        "Enable search and filtering options",
      ],
      requirements: [
        "Resident database access",
        "Privacy consent from residents",
        "User authentication system",
      ],
      configOptions: [
        {
          key: "publicAccess",
          label: "Public directory access",
          type: "toggle",
          description: "Allow all residents to view directory",
          defaultValue: true,
        },
        {
          key: "showPhotos",
          label: "Show profile photos",
          type: "toggle",
          description: "Display resident profile pictures",
          defaultValue: true,
        },
        {
          key: "exportEnabled",
          label: "Allow directory export",
          type: "toggle",
          description: "Let admins export directory data",
          defaultValue: true,
        },
      ],
    },
    config: {
      publicAccess: true,
      showPhotos: true,
      exportEnabled: true,
    },
  },
  {
    id: "9",
    name: "Quick Action Automation",
    description: "Automate common tasks and workflows to save time",
    icon: Zap,
    enabled: true,
    category: "Automation",
    imageUrl: "/api/placeholder/400/300",
    color: "from-yellow-500/20 to-yellow-600/20",
    details: {
      useCases: [
        "Auto-approve trusted visitors based on rules",
        "Automatically notify residents of deliveries",
        "Schedule recurring gate passes for service providers",
        "Trigger actions based on time, events, or conditions",
      ],
      setupSteps: [
        "Define automation rules and triggers",
        "Configure action workflows",
        "Set up conditions and filters",
        "Test automation with sample scenarios",
      ],
      requirements: [
        "Access to gate pass system",
        "Notification system integration",
        "Rule execution permissions",
      ],
      configOptions: [
        {
          key: "autoApprove",
          label: "Auto-approve trusted visitors",
          type: "toggle",
          description: "Automatically approve pre-registered visitors",
          defaultValue: true,
        },
        {
          key: "scheduleRecurring",
          label: "Schedule recurring passes",
          type: "toggle",
          description: "Allow automatic recurring gate pass creation",
          defaultValue: true,
        },
        {
          key: "maxAutomations",
          label: "Max automation rules",
          type: "number",
          description: "Maximum number of active automation rules",
          defaultValue: 50,
        },
      ],
    },
    config: {
      autoApprove: true,
      scheduleRecurring: true,
      maxAutomations: 50,
    },
  },
];

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>(initialPlugins);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [editedConfig, setEditedConfig] = useState<PluginConfig>({});

  const handleTogglePlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((plugin) =>
        plugin.id === pluginId
          ? { ...plugin, enabled: !plugin.enabled }
          : plugin
      )
    );
  };

  const handleOpenDetails = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setEditedConfig(plugin.config);
  };

  const handleCloseDetails = () => {
    setSelectedPlugin(null);
    setEditedConfig({});
  };

  const handleConfigChange = (key: string, value: any) => {
    setEditedConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = () => {
    if (selectedPlugin) {
      setPlugins((prev) =>
        prev.map((plugin) =>
          plugin.id === selectedPlugin.id
            ? { ...plugin, config: editedConfig }
            : plugin
        )
      );
      handleCloseDetails();
    }
  };

  const filteredPlugins = plugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCount = plugins.filter((p) => p.enabled).length;
  const categories = Array.from(new Set(plugins.map((p) => p.category)));

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4 rounded-3xl border bg-gradient-to-br from-[var(--brand-primary,#2563eb)]/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--brand-primary,#2563eb)]/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary,#2563eb)]">
                <Sparkles className="h-3.5 w-3.5" />
                Extend Functionality
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
                Plugins
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Enhance your VMS with powerful integrations and features
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {enabledCount}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Active
                  </div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {plugins.length}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Total
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const count = plugins.filter(
                (p) => p.category === category
              ).length;
              return (
                <Badge key={category} variant="secondary" className="px-3 py-1">
                  {category} ({count})
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Plugins Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlugins.map((plugin) => {
            const Icon = plugin.icon;
            return (
              <Card
                key={plugin.id}
                className="group overflow-hidden border transition-all duration-300 hover:border-[var(--brand-primary,#2563eb)]/50 hover:shadow-lg"
              >
                {/* Plugin Image/Icon Area */}
                <div
                  className={`relative h-40 bg-gradient-to-br ${plugin.color} overflow-hidden`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="h-20 w-20 text-slate-600/30" />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={plugin.enabled ? "default" : "secondary"}
                      className={
                        plugin.enabled
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : ""
                      }
                    >
                      {plugin.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute bottom-3 left-3">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      {plugin.category}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {plugin.name}
                      </CardTitle>
                      <CardDescription className="mt-1.5 line-clamp-2">
                        {plugin.description}
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-[var(--brand-primary,#2563eb)]/10 group-hover:text-[var(--brand-primary,#2563eb)]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Toggle Switch */}
                  <div className="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3">
                    <span className="text-sm font-medium">
                      {plugin.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <button
                      onClick={() => handleTogglePlugin(plugin.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#2563eb)] focus:ring-offset-2 ${
                        plugin.enabled
                          ? "bg-[var(--brand-primary,#2563eb)]"
                          : "bg-gray-200"
                      }`}
                      role="switch"
                      aria-checked={plugin.enabled}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          plugin.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Configure Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handleOpenDetails(plugin)}
                  >
                    <Settings className="h-4 w-4" />
                    Configure & Learn More
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPlugins.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Puzzle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No plugins found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search query
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Plugin Details Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl my-8 bg-white rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div
              className={`relative rounded-t-2xl bg-gradient-to-br ${selectedPlugin.color} p-6`}
            >
              <button
                onClick={handleCloseDetails}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 transition-colors hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm">
                  <selectedPlugin.icon className="h-8 w-8 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedPlugin.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedPlugin.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/90">
                      {selectedPlugin.category}
                    </Badge>
                    <Badge
                      variant={selectedPlugin.enabled ? "default" : "secondary"}
                      className={
                        selectedPlugin.enabled
                          ? "bg-emerald-500 text-white"
                          : "bg-white/90"
                      }
                    >
                      {selectedPlugin.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Use Cases */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Use Cases
                </h3>
                <ul className="space-y-2">
                  {selectedPlugin.details.useCases.map((useCase, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--brand-primary,#2563eb)] flex-shrink-0" />
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {selectedPlugin.details.requirements.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Setup Steps */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  Setup Steps
                </h3>
                <ol className="space-y-3">
                  {selectedPlugin.details.setupSteps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-slate-600"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 flex-shrink-0">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Configuration Options */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
                  <Settings className="h-5 w-5 text-slate-600" />
                  Configuration
                </h3>
                <div className="space-y-4">
                  {selectedPlugin.details.configOptions.map((option) => (
                    <div
                      key={option.key}
                      className="rounded-xl border bg-muted/30 p-4"
                    >
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        {option.label}
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        {option.description}
                      </p>

                      {option.type === "text" && (
                        <Input
                          type="text"
                          value={editedConfig[option.key] || ""}
                          onChange={(e) =>
                            handleConfigChange(option.key, e.target.value)
                          }
                          className="bg-white"
                        />
                      )}

                      {option.type === "number" && (
                        <Input
                          type="number"
                          value={editedConfig[option.key] || 0}
                          onChange={(e) =>
                            handleConfigChange(
                              option.key,
                              parseInt(e.target.value)
                            )
                          }
                          className="bg-white"
                        />
                      )}

                      {option.type === "toggle" && (
                        <button
                          onClick={() =>
                            handleConfigChange(
                              option.key,
                              !editedConfig[option.key]
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            editedConfig[option.key]
                              ? "bg-[var(--brand-primary,#2563eb)]"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              editedConfig[option.key]
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      )}

                      {option.type === "select" && option.options && (
                        <select
                          value={
                            editedConfig[option.key] || option.defaultValue
                          }
                          onChange={(e) =>
                            handleConfigChange(option.key, e.target.value)
                          }
                          className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                        >
                          {option.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t bg-muted/30 px-6 py-4 rounded-b-2xl">
              <div className="flex items-center justify-between gap-4">
                <Button variant="outline" onClick={handleCloseDetails}>
                  Cancel
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open("#", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Documentation
                  </Button>
                  <Button
                    className="gap-2 bg-[var(--brand-primary,#2563eb)] hover:bg-[var(--brand-primary,#2563eb)]/90"
                    onClick={handleSaveConfig}
                  >
                    <Save className="h-4 w-4" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
