

interface PageLoaderProps {
    message?: string;
}

export default function PageLoader({ message }: PageLoaderProps) {
    return (
        <div className="my-4">
            <p className="text-center">{message || "⏳ Loading..."}</p>
        </div>
    );
}