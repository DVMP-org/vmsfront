import { cn } from "@/lib/utils";

type Colours = "primary" | "secondary" | "brand-primary" | "brand-secondary" | "indigo";

interface LoaderProps {
  size?: number;
  colour?: Colours;
  className?: string;
}

export const Loader = ({
  size = 16,
  colour = "primary",
  className,
}: LoaderProps) => {
  return (
    <svg
      className={cn("animate-spin", className)}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
    >
      <circle cx="10" cy="10" r="9.25" stroke="transparent" strokeWidth="1.5" />
      <path
        d="M10 0.595792C10 0.266746 10.267 -0.00185055 10.5954 0.0177417C11.9786 0.100242 13.3318 0.469461 14.5682 1.1044C15.9816 1.83021 17.2016 2.88235 18.1273 4.17366C19.0531 5.46496 19.6578 6.95826 19.8913 8.52984C20.1249 10.1014 19.9807 11.706 19.4705 13.2108C18.9604 14.7155 18.0991 16.077 16.9579 17.1825C15.8167 18.288 14.4285 19.1056 12.9084 19.5677C11.3882 20.0298 9.77982 20.123 8.21646 19.8397C6.84883 19.5918 5.55009 19.0619 4.40196 18.2863C4.12931 18.1021 4.08072 17.7265 4.28083 17.4653C4.48094 17.2041 4.85388 17.1564 5.12801 17.3384C6.12474 18.0001 7.24768 18.4531 8.42898 18.6672C9.80606 18.9168 11.2228 18.8347 12.5618 18.4276C13.9008 18.0206 15.1236 17.3004 16.1288 16.3266C17.134 15.3528 17.8927 14.1536 18.342 12.8282C18.7914 11.5027 18.9185 10.0893 18.7127 8.70502C18.507 7.32071 17.9743 6.00535 17.1589 4.86792C16.3435 3.73048 15.2688 2.80371 14.0238 2.16439C12.9559 1.61596 11.789 1.29259 10.5954 1.21173C10.2671 1.18949 10 0.92484 10 0.595792Z"
        fill="currentColor"
        className={cn(
          colour === "primary" && "text-white",
          colour === "secondary" && "text-muted-foreground",
          colour === "brand-primary" && "text-[rgb(var(--brand-primary))]",
          colour === "brand-secondary" && "text-[rgb(var(--brand-secondary))]",
          colour === "indigo" && "text-indigo-600"
        )}
      />
    </svg>
  );
};
