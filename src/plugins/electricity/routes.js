import dynamic from "next/dynamic";

export default {
    ElectricityHome: dynamic(() => import("./components/ElectricityHome")),
    ValidateMeter: dynamic(() => import("./components/ValidateMeter")),
    PurchaseMeter: dynamic(() => import("./components/PurchaseMeter"))
};
