import dynamic from "next/dynamic";


const ElectricityHome = dynamic(() => import("./pages/ElectricityHome"));
const ValidateMeter = dynamic(() => import("./pages/ValidateMeter"));
const PurchaseMeter = dynamic(() => import("./pages/PurchaseMeter"));

const routes = [
    {
        path: "/",  // Changed from "" to "/" for consistency
        component: ElectricityHome
    },
    {
        path: "/validate",
        component: ValidateMeter
    },
    {
        path: "/purchase",
        component: PurchaseMeter
    }
];

export default routes;
