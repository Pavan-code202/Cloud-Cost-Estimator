import axios from 'axios'; import type { Estimate,Project,Workload } from '../types';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'});
export const createUser=(data:{name:string;email:string;password:string})=>api.post('/users',data).then(r=>r.data);
export const signIn=(data:{email:string;password:string})=>api.post('/signin',data).then(r=>r.data);
export const getProjects=()=>api.get<Project[]>('/projects').then(r=>r.data);
export const createProject=(data:{userId:string;name:string;description?:string})=>api.post<Project>('/projects',data).then(r=>r.data);
export const estimate=(projectId:string,workload:Workload)=>api.post<Estimate>('/estimations',{projectId,workload}).then(r=>r.data);
