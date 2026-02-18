"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    useMarketplacePlugins,
    useMarketplaceCategories,
    useInstallPlugin,
    usePrefetchMarketplacePlugin,
} from "@/hooks/use-marketplace";
import { MarketplacePlugin } from "@/types/plugin";
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
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    Store,
    Search,
    Sparkles,
    Download,
    Star,
    CheckCircle2,
    ExternalLink,
    X,
    Package,
    Users,
    Clock,
    Shield,
    ArrowRight,
    Loader2,
} from "lucide-react";
import { formatNumber, formatPrice, titleCase, safeOpenUrl } from "@/lib/utils";
import { FilterConfig } from "@/components/ui/DataTable";
import { formatFiltersForAPI } from "@/lib/table-utils";

export default function MarketplacePage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [installed, setInstalled] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [selectedPlugin, setSelectedPlugin] = useState<MarketplacePlugin | null>(null);
    const [installingPluginId, setInstallingPluginId] = useState<string | null>(null);

    const prefetchPlugin = usePrefetchMarketplacePlugin();
    const installPluginMutation = useInstallPlugin();

    // Fetch categories
    const { data: categories = [] } = useMarketplaceCategories();

    const activeFilters = useMemo(() => {
        const filters: FilterConfig[] = [];
        // Only add category filter if a category is actually selected (not empty string)
        if (selectedCategory && selectedCategory !== "") {
            filters.push({ field: "category", operator: "eq", value: selectedCategory });
        }
        // Only add installed filter if explicitly set to true
        if (installed === true) {
            filters.push({ field: "installed", operator: "eq", value: installed });
        }
        return filters;
    },
        [
            installed,
            selectedCategory
        ]
    );
    // Fetch marketplace plugins
    const {
        data: pluginsData,
        isLoading: isLoadingPlugins,
        isFetching,
    } = useMarketplacePlugins({
        page,
        pageSize: 12,
        search: searchQuery || undefined,
        filters: formatFiltersForAPI(activeFilters),
    });




    const plugins = pluginsData?.items || [];
    const totalPlugins = pluginsData?.total || 0;
    const installedCount = plugins.filter((p) => p.installed).length;

    const handleInstall = async (plugin: MarketplacePlugin) => {
        // Prevent duplicate installs by checking if already installing
        if (installingPluginId === plugin.id || installPluginMutation.isPending) {
            return;
        }
        
        setInstallingPluginId(plugin.id);
        installPluginMutation.mutate(plugin.id, {
            onSettled: () => {
                setInstallingPluginId(null);
                setSelectedPlugin(null);
            },
        });
    };

    const handleOpenDetails = (plugin: MarketplacePlugin) => {
        setSelectedPlugin(plugin);
    };

    const handleCloseDetails = () => {
        setSelectedPlugin(null);
    };


    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${star <= Math.round(rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                            }`}
                    />
                ))}
                <span className="ml-1 text-xs text-muted-foreground">
                    ({rating?.toFixed(1)})
                </span>
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="space-y-4 rounded-3xl border bg-gradient-to-br from-[var(--brand-primary,#213928)]/10 via-white to-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--brand-primary,#213928)]/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary,#213928)]">
                                <Sparkles className="h-3.5 w-3.5" />
                                Discover & Install
                            </div>
                            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-foreground">
                                Plugin Marketplace
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground">
                                Browse and install plugins to extend your VMS capabilities
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-foreground">
                                        {installedCount}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                        Installed
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-border" />
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-foreground">
                                        {totalPlugins}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                        Available
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/admin/plugins")}
                                className="gap-2"
                            >
                                View Installed
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search plugins by name, description, or author..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10 bg-white"
                        />
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant={selectedCategory === "" ? "default" : "secondary"}
                            className="px-3 py-1 cursor-pointer transition-colors"
                            onClick={() => {
                                setSelectedCategory("");
                                setPage(1);
                            }}
                        >
                            All ({totalPlugins})
                        </Badge>
                        {categories.map((category, index) => (
                            <Badge
                                key={index}
                                variant={selectedCategory === category.name ? "default" : "secondary"}
                                className="px-3 py-1 cursor-pointer transition-colors"
                                onClick={() => {
                                    setSelectedCategory(
                                        selectedCategory === category.name ? "" : category.name
                                    );
                                    setPage(1);
                                }}
                            >
                                {category.name} ({category.pluginCount})
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {isLoadingPlugins && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <Skeleton className="h-40 w-full" />
                                <CardHeader className="pb-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2 mt-2" />
                                    <Skeleton className="h-4 w-full mt-2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Plugins Grid */}
                {!isLoadingPlugins && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {plugins.map((plugin) => (
                            <Card
                                key={plugin.id}
                                className="group overflow-hidden border transition-all duration-300 hover:border-[var(--brand-primary,#213928)]/50 hover:shadow-lg cursor-pointer"
                                onClick={() => handleOpenDetails(plugin)}
                                onMouseEnter={() => prefetchPlugin(plugin.id)}
                            >
                                {/* Plugin Image Area */}
                                <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                    {plugin.image ? (
                                        <img
                                            src={plugin.image}
                                            alt={plugin.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Package className="h-20 w-20 text-slate-400/50" />
                                        </div>
                                    )}

                                    {/* Price Badge */}
                                    <div className="absolute top-3 right-3">
                                        <Badge
                                            variant={plugin.price === 0 ? "default" : "secondary"}
                                            className={
                                                plugin.price === 0
                                                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                                    : "bg-white/90 backdrop-blur-sm"
                                            }
                                        >
                                            {formatPrice(plugin.price, plugin.currency)}
                                        </Badge>
                                    </div>

                                    {/* Installed Badge */}
                                    {plugin.installed && (
                                        <div className="absolute top-3 left-3">
                                            <Badge
                                                variant="default"
                                                className="bg-blue-500 text-white gap-1"
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                                Installed
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    <div className="absolute bottom-3 left-3">
                                        <Badge
                                            variant="default"
                                            className="bg-white/90 backdrop-blur-sm"
                                        >
                                            {titleCase(plugin.category)}
                                        </Badge>
                                    </div>
                                </div>

                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate text-red-100">
                                                {titleCase(plugin.name)}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                by {plugin.author || process.env.NEXT_PUBLIC_APP_NAME}
                                            </p>
                                            <CardDescription className="mt-1.5 line-clamp-2">
                                                {plugin.description}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    {/* Rating & Stats */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                        {renderStars(plugin.rating)}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Download className="h-3 w-3" />
                                                {formatNumber(plugin.installed_count)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {plugin.review_count}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <Button
                                        variant={plugin.installed ? "outline" : "primary"}
                                        className="w-full gap-2"
                                        disabled={installingPluginId === plugin.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (plugin.installed) {
                                                // Sanitize plugin ID before using in URL
                                                const sanitizedId = encodeURIComponent(plugin.id);
                                                router.push(`/admin/plugins?pluginId=${sanitizedId}`);
                                            } else {
                                                handleInstall(plugin);
                                            }
                                        }}
                                    >
                                        {installingPluginId === plugin.id ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Installing...
                                            </>
                                        ) : plugin.installed ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Manage Plugin
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4" />
                                                Install Plugin
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoadingPlugins && plugins.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                <Store className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">No plugins found</h3>
                            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
                                {searchQuery || selectedCategory
                                    ? "Try adjusting your search or filters to find what you're looking for."
                                    : "No plugins are available in the marketplace yet. Check back later!"}
                            </p>
                            {(searchQuery || selectedCategory) && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedCategory("");
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {!isLoadingPlugins && pluginsData && pluginsData.total_pages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1 || isFetching}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-4">
                            Page {page} of {pluginsData.total_pages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === pluginsData.total_pages || isFetching}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {/* Plugin Detail Modal */}
            <Modal
                isOpen={!!selectedPlugin}
                onClose={handleCloseDetails}
                title={selectedPlugin?.name || "Plugin Details"}
                size="lg"
            >
                {selectedPlugin && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {selectedPlugin.image ? (
                                    <img
                                        src={selectedPlugin.image}
                                        alt={selectedPlugin.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Package className="h-10 w-10 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold">{selectedPlugin.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            by {selectedPlugin.author || process.env.NEXT_PUBLIC_APP_NAME} • v{selectedPlugin.version}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={selectedPlugin.price === 0 ? "default" : "secondary"}
                                        className={
                                            selectedPlugin.price === 0
                                                ? "bg-emerald-500 text-white"
                                                : ""
                                        }
                                    >
                                        {formatPrice(selectedPlugin.price, selectedPlugin.currency)}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    {renderStars(selectedPlugin.rating)}
                                    <span className="text-sm text-muted-foreground">
                                        {selectedPlugin.review_count} reviews
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">
                                {selectedPlugin.description}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-xl border bg-muted/50 p-4 text-center">
                                <Download className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <div className="text-lg font-semibold">
                                    {formatNumber(selectedPlugin.installed_count)}
                                </div>
                                <div className="text-xs text-muted-foreground">Downloads</div>
                            </div>
                            <div className="rounded-xl border bg-muted/50 p-4 text-center">
                                <Star className="h-6 w-6 mx-auto mb-2 text-amber-400" />
                                <div className="text-lg font-semibold">
                                    {selectedPlugin?.rating?.toFixed(1)}
                                </div>
                                <div className="text-xs text-muted-foreground">Rating</div>
                            </div>
                            <div className="rounded-xl border bg-muted/50 p-4 text-center">
                                <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <div className="text-lg font-semibold">
                                    {selectedPlugin?.lastUpdated
                                        ? new Date(selectedPlugin.lastUpdated).toLocaleDateString()
                                        : "N/A"}
                                </div>
                                <div className="text-xs text-muted-foreground">Last Updated</div>
                            </div>
                        </div>

                        {/* Features */}
                        {selectedPlugin.details?.useCases && selectedPlugin.details.useCases.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2">Use Cases</h4>
                                <ul className="space-y-1">
                                    {selectedPlugin.details.useCases.slice(0, 4).map((useCase, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="h-4 w-4 text-[var(--brand-primary,#213928)] flex-shrink-0 mt-0.5" />
                                            <span>{useCase}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}


                        {/* Requirements */}
                        {selectedPlugin?.details?.requirements && selectedPlugin.details.requirements.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2">Requirements</h4>
                                <ul className="space-y-1">
                                    {selectedPlugin.details.requirements.map((req, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Shield className="h-4 w-4 flex-shrink-0" />
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tags */}
                        {selectedPlugin.tags && selectedPlugin.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedPlugin.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                        {titleCase(tag)}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4 border-t">
                            <Button
                                variant={selectedPlugin.installed ? "outline" : "primary"}
                                className="flex-1 gap-2"
                                disabled={installingPluginId === selectedPlugin.id}
                                onClick={() => {
                                    if (selectedPlugin.installed) {
                                        // Sanitize plugin ID before using in URL
                                        const sanitizedId = encodeURIComponent(selectedPlugin.id);
                                        router.push(`/admin/plugins?pluginId=${sanitizedId}`);
                                        handleCloseDetails();
                                    } else {
                                        handleInstall(selectedPlugin);
                                    }
                                }}
                            >
                                {installingPluginId === selectedPlugin.id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Installing...
                                    </>
                                ) : selectedPlugin.installed ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Manage Plugin
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        Install Plugin
                                    </>
                                )}
                            </Button>

                            {selectedPlugin.documentationUrl && (
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => safeOpenUrl(selectedPlugin.documentationUrl)}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Docs
                                </Button>
                            )}

                            {selectedPlugin.supportUrl && (
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => safeOpenUrl(selectedPlugin.supportUrl)}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Support
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
