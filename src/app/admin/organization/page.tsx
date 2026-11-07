"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contextApi } from "@/features/context/api";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import "../properties/styles.css";
export default function OrganizationPage(){
 const org=useAppStore(s=>s.organization),user=useAuthStore(s=>s.user);
 const key=`${org?.id}:${user?.id}`;
 const profile=useQuery({queryKey:["organization-profile",key],queryFn:async()=>(await adminService.getAdminProfile()).data,enabled:!!org&&!!user,staleTime:0});
 const details=useQuery({queryKey:["organization-settings",key],queryFn:contextApi.organization,enabled:profile.isFetchedAfterMount&&!profile.isError&&hasAdminPermission(profile.data,"organizations.show")});
 const catalog=useQuery({queryKey:["context-catalog",key],queryFn:contextApi.catalog,enabled:!!profile.data});
 if(profile.isError||details.isError)return <div role="alert">{parseApiError(profile.error||details.error).message}<button onClick={()=>{profile.refetch();details.refetch();}}>Retry</button></div>;
 if(profile.isPending)return <p role="status">Loading organization…</p>;
 if(!hasAdminPermission(profile.data,"organizations.show"))return <p role="alert">You do not have permission to view organization settings.</p>;
 if(details.isPending)return <p role="status">Loading organization…</p>;
 return <main className="property-workspace"><header className="property-heading"><div><p className="property-eyebrow">ORGANIZATION / ADMINISTRATION</p><h1>{details.data.name}</h1><p>Manage the organization that owns your properties and workspaces.</p></div></header><nav className="property-viewline"><Link href="/admin">Dashboard</Link><span>Organization settings</span></nav><dl className="property-facts"><div><dt>Operating use case</dt><dd>{catalog.data?.use_cases.find(c=>c.value===details.data.use_case)?.label||details.data.use_case}<small>Fixed when the organization is created</small></dd></div><div><dt>Organization URL identifier</dt><dd>{details.data.slug}<small>The organization URL cannot be changed here.</small></dd></div></dl><OrganizationEditor key={key+details.data.updated_at} org={details.data} editable={hasAdminPermission(profile.data,"organizations.update")} /></main>;
}
function OrganizationEditor({org,editable}:{org:{name:string;description?:string|null;slug:string};editable:boolean}){
 const [name,setName]=useState(org.name),[description,setDescription]=useState(org.description||"");const client=useQueryClient();const update=useAppStore(s=>s.setSelectedOrganization);
 const mutation=useMutation({mutationFn:()=>contextApi.updateOrganization({name:name.trim(),description:description.trim()||null}),onSuccess:async data=>{update(data);await client.invalidateQueries({queryKey:["organization-settings"]});}});
 function submit(e:FormEvent){e.preventDefault();mutation.mutate();}
 return <form className="property-editor" onSubmit={submit}><h2>Organization details</h2><fieldset disabled={!editable||mutation.isPending}><label>Name<input required maxLength={255} value={name} onChange={e=>setName(e.target.value)}/></label><label>Description<textarea maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label></fieldset>{!editable&&<p>You can view organization settings. Ask an authorized administrator to update them.</p>}{mutation.isError&&<p role="alert">{parseApiError(mutation.error).message}</p>}{mutation.isSuccess&&<p role="status">Organization saved.</p>}{editable&&<button className="property-primary" disabled={mutation.isPending||!name.trim()}>{mutation.isPending?"Saving…":"Save organization"}</button>}<p><Link href="/admin/admins">Manage administrators</Link> · <Link href="/admin/admins/roles">Manage roles</Link></p></form>;
}
