import {NavLink,Route,Routes,useNavigate,useParams} from 'react-router-dom';
import {useEffect,useState} from 'react';
import {Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {createProject,createUser,estimate,getProjects,signIn} from './services/api';
import type {Estimate,Project,Workload} from './types';

const identityKey='multicloud-demo-user';
const resultKey='multicloud-last-estimate';

function getStoredUser(){
  const raw=localStorage.getItem(identityKey);
  if(!raw)return null;
  try{return JSON.parse(raw);}catch{return null;}
}

function AuthScreen({onSignedIn}:{onSignedIn:(user:any)=>void}){
  const [mode,setMode]=useState<'signin'|'signup'>('signin');
  const [error,setError]=useState('');
  const n=useNavigate();

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const email=String(f.get('email'));
    const password=String(f.get('password'));

    try {
      if (mode === 'signin') {
        const user=await signIn({email,password});
        localStorage.setItem(identityKey,JSON.stringify(user));
        onSignedIn(user);
        n('/');
        return;
      }

      const name=String(f.get('name'));
      const user=await createUser({name,email,password});
      localStorage.setItem(identityKey,JSON.stringify(user));
      onSignedIn(user);
      n('/');
    }catch (e:any) {
      setError(e.response?.data?.error ?? 'Authentication failed');
    }
  }

  return <section className="card narrow">
    <h2>{mode === 'signin' ? 'Welcome back' : 'Start planning'}</h2>
    <p>{mode === 'signin' ? 'Sign in to your local demo account.' : 'Create a local demo account to make projects.'}</p>
    <form onSubmit={submit}>
      {mode === 'signup' && <input name="name" placeholder="Your name" required/>}
      <input name="email" type="email" placeholder="Email" required/>
      <input name="password" type="password" minLength={8} placeholder="Password (8+ characters)" required/>
      <button>{mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      <p>
        <button type="button" onClick={()=>setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </p>
      {error && <p className="error">{error}</p>}
    </form>
  </section>;
}

function Layout({children,user,onSignOut}:{children:React.ReactNode;user:any;onSignOut:()=>void}){
  const n=useNavigate();

  function handleSignOut(){
    onSignOut();
    n('/');
  }

  return <>
    <header>
      <h1>CloudCompare</h1>
      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/projects/new">New project</NavLink>
        {user && <button type="button" onClick={handleSignOut}>Sign out</button>}
      </nav>
    </header>
    <main>{children}</main>
  </>;
}

function Register({onSignedIn}:{onSignedIn:(user:any)=>void}){
  return <AuthScreen onSignedIn={onSignedIn}/>;
}

function Dashboard({user,onSignedIn}:{user:any;onSignedIn:(user:any)=>void}){
  const [projects,setProjects]=useState<Project[]>([]);
  useEffect(()=>{
    if(user)getProjects().then(setProjects).catch(()=>setProjects([]));
  },[user]);
  if(!user)return <Register onSignedIn={onSignedIn}/>;
  return <>
    <section className="hero">
      <div>
        <p className="eyebrow">WORKLOAD-AWARE COST ESTIMATION</p>
        <h2>Plan your cloud deployment with real seed pricing.</h2>
        <p>Compare compatible AWS, Azure and Google Cloud VM configurations.</p>
        <NavLink className="button" to="/projects/new">Create estimation</NavLink>
      </div>
      <div className="metric">
        <strong>{projects.length}</strong>
        <span>Projects</span>
      </div>
    </section>
    <section className="card">
      <h2>Recent projects</h2>
      {projects.length?<ul>{projects.map(p=><li key={p.id}><NavLink to={`/projects/${p.id}/workload`}>{p.name}</NavLink><small>{p.description}</small></li>)}</ul>:<p>No projects yet.</p>}
    </section>
  </>;
}

function NewProject(){
  const n=useNavigate();
  const [error,setError]=useState('');
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const u=JSON.parse(localStorage.getItem(identityKey)??'null');
    if(!u)return n('/');
    const f=new FormData(e.currentTarget);
    try{
      const p=await createProject({userId:u.id,name:String(f.get('name')),description:String(f.get('description'))});
      n(`/projects/${p.id}/workload`);
    }catch(e:any){
      setError(e.response?.data?.error??'Could not save project');
    }
  }
  return <section className="card narrow">
    <h2>Create project</h2>
    <form onSubmit={submit}>
      <input name="name" placeholder="Project name" required/>
      <textarea name="description" placeholder="Description"/>
      <button>Create and add workload</button>
      {error&&<p className="error">{error}</p>}
    </form>
  </section>;
}

function WorkloadForm(){
  const {id=''}=useParams();
  const n=useNavigate();
  const [error,setError]=useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    
    // Parse values
    const cpu = +f.get('cpu')!;
    const ram = +f.get('ram')!;
    const storage = +f.get('storage')!;
    const network = +f.get('network')!;
    const users = +f.get('users')!;
    const minWorkload = +f.get('minWorkload')!;
    const avgWorkload = +f.get('avgWorkload')!;
    const peakWorkload = +f.get('peakWorkload')!;
    const usageHours = +f.get('usageHours')!;
    const peakHours = +f.get('peakHours')!;

    // Validation
    const errors: string[] = [];
    if (minWorkload < 0 || minWorkload > 100) errors.push('Minimum workload must be 0-100%');
    if (avgWorkload < 0 || avgWorkload > 100) errors.push('Average workload must be 0-100%');
    if (peakWorkload < 0 || peakWorkload > 100) errors.push('Peak workload must be 0-100%');
    if (minWorkload > avgWorkload) errors.push('Minimum must be ≤ average');
    if (avgWorkload > peakWorkload) errors.push('Average must be ≤ peak');
    if (peakHours > usageHours) errors.push('Peak hours must be ≤ usage hours');
    if (usageHours <= 0 || usageHours > 24) errors.push('Usage hours must be 0-24');
    if (cpu < 0 || ram < 0 || storage < 0 || network < 0) errors.push('Resource values cannot be negative');

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    const workload: Workload = {
      cpu, ram, storage, network, users,
      minimumWorkloadPercent: minWorkload,
      averageWorkloadPercent: avgWorkload,
      peakWorkloadPercent: peakWorkload,
      usageHoursPerDay: usageHours,
      peakHoursPerDay: peakHours
    };

    try{
      const data=await estimate(id, workload);
      sessionStorage.setItem(resultKey,JSON.stringify(data));
      n('/results');
    }catch(e:any){
      setError(e.response?.data?.error??'Estimation failed');
    }
  }

  return <section className="card narrow">
    <h2>Workload requirements</h2>
    <p>Define resource requirements and expected workload characteristics. Configurations are evaluated based on whether they can handle the expected peak workload.</p>
    <form onSubmit={submit}>
      <div className="grid">
        <label>vCPU<input name="cpu" type="number" min="1" step="0.1" defaultValue="4" required/></label>
        <label>RAM (GB)<input name="ram" type="number" min="0.1" step="0.1" defaultValue="8" required/></label>
        <label>Storage (GB)<input name="storage" type="number" min="0" step="1" defaultValue="200" required/></label>
        <label>Data transfer (GB/mo)<input name="network" type="number" min="0" step="1" defaultValue="500" required/></label>
        <label>Expected users<input name="users" type="number" min="0" defaultValue="2000" required/></label>
      </div>

      <h3 style={{marginTop: '1.5rem'}}>Expected workload characteristics (%)</h3>
      <p style={{fontSize: '0.9rem', color: '#666'}}>Percentages represent expected resource utilization at different load levels. These are used to evaluate if configurations can handle your workload, not to reduce billing hours.</p>
      <div className="grid">
        <label>Minimum workload (%)<input name="minWorkload" type="number" min="0" max="100" step="1" defaultValue="20" required/></label>
        <label>Average workload (%)<input name="avgWorkload" type="number" min="0" max="100" step="1" defaultValue="50" required/></label>
        <label>Peak workload (%)<input name="peakWorkload" type="number" min="0" max="100" step="1" defaultValue="90" required/></label>
      </div>

      <h3 style={{marginTop: '1.5rem'}}>Usage patterns</h3>
      <div className="grid">
        <label>Usage hours/day<input name="usageHours" type="number" min="0.1" max="24" step="0.1" defaultValue="10" required/></label>
        <label>Peak hours/day<input name="peakHours" type="number" min="0" max="24" step="0.1" defaultValue="2" required/></label>
      </div>

      <button style={{marginTop: '1rem'}}>Compare configurations</button>
      {validationErrors.length > 0 && <div className="error" style={{marginTop: '1rem'}}>
        {validationErrors.map((err, i) => <p key={i}>• {err}</p>)}
      </div>}
      {error&&<p className="error">{error}</p>}
    </form>
  </section>;
}

function Results(){
  const data=JSON.parse(sessionStorage.getItem(resultKey)??'null') as Estimate|null;
  if(!data)return <section className="card"><h2>No estimation selected</h2><NavLink to="/">Return to dashboard</NavLink></section>;
  
  const chart=data.results.map(r=>({name:`${r.provider} · ${r.configuration}`,cost:+r.costs.totalMonthlyCost.toFixed(2)}));
  const coverage=[...new Set(data.results.flatMap(r=>r.coverageWarnings))];
  const wp = data.workloadProfile;

  return <>
    <section className="hero compact">
      <div>
        <p className="eyebrow">ESTIMATION COMPLETE</p>
        <h2>Configuration comparison</h2>
        <p>{data.configurationsPassed} of {data.configurationsEvaluated} configurations passed workload requirements · {wp.billableHoursPerMonth} billable hours/month</p>
      </div>
    </section>

    <section className="card">
      <h2>Workload profile</h2>
      <div className="grid" style={{fontSize: '0.95rem'}}>
        <div>
          <strong>Resource utilization</strong>
          <p>Minimum: {wp.minimumWorkloadPercent}%</p>
          <p>Average: {wp.averageWorkloadPercent}%</p>
          <p>Peak: {wp.peakWorkloadPercent}%</p>
        </div>
        <div>
          <strong>Usage pattern</strong>
          <p>Usage hours/day: {wp.usageHoursPerDay}</p>
          <p>Peak hours/day: {wp.peakHoursPerDay}</p>
          <p>Billable hours/month: {wp.billableHoursPerMonth}</p>
        </div>
        <div>
          <strong>Peak demands</strong>
          <p>Peak CPU: {wp.peakCpuDemand} vCPU</p>
          <p>Peak RAM: {wp.peakRamDemand} GB</p>
        </div>
      </div>
    </section>

    {coverage.length>0&&<section className="notice"><strong>Compute-only pricing snapshot.</strong> Storage, network/data transfer, and IP costs are shown as USD 0.00 until verified provider rates are added to the dataset.</section>}

    <section className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Configuration</th>
            <th>Resources</th>
            <th>Compute</th>
            <th>Storage</th>
            <th>Network</th>
            <th>Total/month</th>
          </tr>
        </thead>
        <tbody>
          {data.results.map((r,i)=><tr key={r.provider+r.configuration} className={i===0?'lowest':''}>
            <td><strong>{r.provider}</strong><small>{r.service} · {r.region}</small></td>
            <td><strong>{r.configuration}</strong></td>
            <td>{r.vcpu} vCPU · {r.ramGb} GB</td>
            <td>${r.costs.computeCost.toFixed(2)}</td>
            <td>${r.costs.storageCost.toFixed(2)}</td>
            <td>${r.costs.networkCost.toFixed(2)}</td>
            <td><strong>${r.costs.totalMonthlyCost.toFixed(2)}</strong>{i===0&&<small className="lowest-label">Lowest Estimated Cost</small>}</td>
          </tr>)}
        </tbody>
      </table>
    </section>

    <section className="card">
      <h2>Monthly compute comparison (USD)</h2>
      <div className="chart">
        <ResponsiveContainer>
          <BarChart data={chart} margin={{bottom:55}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="name" interval={0} angle={-28} textAnchor="end" height={70} tick={{fill:'#999'}}/>
            <YAxis/>
            <Tooltip/>
            <Bar dataKey="cost" fill="#0066cc"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  </>;
}

export default function App(){
  const [user,setUser]=useState<any>(()=>getStoredUser());

  function handleSignedIn(nextUser:any){
    setUser(nextUser);
  }

  function handleSignOut(){
    localStorage.removeItem(identityKey);
    setUser(null);
  }

  return <Layout user={user} onSignOut={handleSignOut}>
    <Routes>
      <Route path="/" element={<Dashboard user={user} onSignedIn={handleSignedIn}/>}/>
      <Route path="/projects/new" element={<NewProject/>}/>
      <Route path="/projects/:id/workload" element={<WorkloadForm/>}/>
      <Route path="/results" element={<Results/>}/>
    </Routes>
  </Layout>;
}
