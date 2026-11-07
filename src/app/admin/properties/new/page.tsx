import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";
export default function Page({searchParams}:{searchParams:{parent?:string}}){return <PropertiesWorkspace route={{action:"new",parentId:searchParams.parent}} />;}
