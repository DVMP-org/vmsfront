import { GuestsDirectory } from "@/features/hospitality/components/GuestsDirectory";

/**
 * Everyone this Site has hosted, or is expecting.
 *
 * The directory is server-paginated and searches the whole guest set, not the
 * twenty rows on screen.
 */
export default function HospitalityGuestsPage() {
    return <GuestsDirectory />;
}
