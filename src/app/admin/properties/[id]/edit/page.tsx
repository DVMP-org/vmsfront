import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";
export default function Page({params}:{params:{id:string}}){return <PropertiesWorkspace route={{id:params.id,action:"edit"}} />;}
