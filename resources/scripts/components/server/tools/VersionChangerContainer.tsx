import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import reinstallServer from '@/api/server/reinstallServer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

type Software = 'paper' | 'purpur' | 'vanilla' | 'spigot' | 'fabric' | 'forge';

/* ─── SVG Logos ──────────────────────────────────────────────── */
const PaperLogo = () => (
    <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
        <rect width="48" height="48" rx="10" fill="#1c1c1c"/>
        <path d="M14 36L24 12L34 36" stroke="#e8e8e8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 28H31" stroke="#e8e8e8" strokeWidth="3" strokeLinecap="round"/>
    </svg>
);
const PurpurLogo = () => (
    <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
        <rect width="48" height="48" rx="10" fill="#1e0a30"/>
        <circle cx="24" cy="24" r="12" fill="none" stroke="#7c3aed" strokeWidth="2"/>
        <circle cx="24" cy="24" r="7" fill="#7c3aed"/>
        <circle cx="24" cy="24" r="3" fill="#c4b5fd"/>
        <circle cx="24" cy="12" r="2" fill="#7c3aed"/>
        <circle cx="24" cy="36" r="2" fill="#7c3aed"/>
        <circle cx="12" cy="24" r="2" fill="#7c3aed"/>
        <circle cx="36" cy="24" r="2" fill="#7c3aed"/>
    </svg>
);
const VanillaLogo = () => (
    <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
        <rect width="48" height="48" rx="10" fill="#162008"/>
        <rect x="10" y="10" width="28" height="28" rx="4" fill="#5b9e3b"/>
        <rect x="10" y="24" width="28" height="14" fill="#8B6144"/>
        <rect x="10" y="34" width="28" height="4" rx="4" fill="#7a5538"/>
        <rect x="10" y="10" width="28" height="6" rx="4" fill="#72c44a" opacity="0.7"/>
    </svg>
);
const SpigotLogo = () => (
    <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
        <rect width="48" height="48" rx="10" fill="#1c1000"/>
        <rect x="12" y="16" width="24" height="9" rx="3" fill="#f59e0b"/>
        <rect x="19" y="25" width="10" height="9" rx="2" fill="#d97706"/>
        <rect x="8" y="18" width="7" height="5" rx="2" fill="#f59e0b"/>
        <ellipse cx="24" cy="37.5" rx="2.5" ry="3.5" fill="#60a5fa" opacity="0.8"/>
    </svg>
);
const FabricLogo = () => (
    <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
        <rect width="48" height="48" rx="10" fill="#0d180a"/>
        <rect x="10" y="10" width="8" height="8" rx="1.5" fill="#bef264" opacity="0.9"/>
        <rect x="20" y="10" width="8" height="8" rx="1.5" fill="#65a30d" opacity="0.9"/>
        <rect x="30" y="10" width="8" height="8" rx="1.5" fill="#bef264" opacity="0.9"/>
        <rect x="10" y="20" width="8" height="8" rx="1.5" fill="#65a30d" opacity="0.9"/>
        <rect x="20" y="20" width="8" height="8" rx="1.5" fill="#bef264" opacity="0.9"/>
        <rect x="30" y="20" width="8" height="8" rx="1.5" fill="#65a30d" opacity="0.9"/>
        <rect x="10" y="30" width="8" height="8" rx="1.5" fill="#bef264" opacity="0.9"/>
        <rect x="20" y="30" width="8" height="8" rx="1.5" fill="#65a30d" opacity="0.9"/>
        <rect x="30" y="30" width="8" height="8" rx="1.5" fill="#bef264" opacity="0.9"/>
    </svg>
);
const ForgeLogo = () => (
    <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
        <rect width="48" height="48" rx="10" fill="#1a0800"/>
        <rect x="11" y="26" width="26" height="11" rx="2" fill="#c2410c"/>
        <path d="M17 26V21C17 18.2 19.2 16 22 16H26C28.8 16 31 18.2 31 21V26" fill="#ea580c"/>
        <path d="M22 25C22 21 26 19 24 14C27 17 27 23 23 25" fill="#fbbf24" opacity="0.95"/>
        <rect x="13" y="35" width="22" height="4" rx="2" fill="#9a3412"/>
    </svg>
);

const SOFTWARE: { id: Software; label: string; Logo: React.FC; desc: string }[] = [
    { id: 'paper',   label: 'Paper',   Logo: PaperLogo,   desc: 'High-perf Bukkit fork' },
    { id: 'purpur',  label: 'Purpur',  Logo: PurpurLogo,  desc: 'Extra patches & features' },
    { id: 'vanilla', label: 'Vanilla', Logo: VanillaLogo, desc: 'Official Mojang server' },
    { id: 'spigot',  label: 'Spigot',  Logo: SpigotLogo,  desc: 'CraftBukkit fork' },
    { id: 'fabric',  label: 'Fabric',  Logo: FabricLogo,  desc: 'Lightweight mod loader' },
    { id: 'forge',   label: 'Forge',   Logo: ForgeLogo,   desc: 'Classic mod framework' },
];

/* ─── Keyframes ──────────────────────────────────────────────── */
const dotBounce = keyframes`
    0%,80%,100%{transform:scale(0.35);opacity:0.25;}
    40%{transform:scale(1);opacity:1;}
`;
const fadeUp = keyframes`
    from{opacity:0;transform:translateY(14px);}
    to{opacity:1;transform:translateY(0);}
`;
const cardIn = keyframes`
    from{opacity:0;transform:translateY(8px);}
    to{opacity:1;transform:translateY(0);}
`;

/* ─── Styled ─────────────────────────────────────────────────── */
const Page = styled.div`
    padding: 28px;
    max-width: 740px;
    color: #e8f5e8;
    font-family: 'Inter', sans-serif;
    animation: ${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
`;
const Heading = styled.h2`
    font-size: 1.05rem; font-weight: 700; color: #e8f5e8;
    margin: 0 0 4px; letter-spacing: -0.025em;
`;
const Sub = styled.p`font-size: 0.775rem; color: #3d5c3d; margin: 0 0 22px;`;
const Grid = styled.div`
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px;
`;
const SoftCard = styled.button<{ $sel?: boolean; $delay?: number }>`
    display: flex; flex-direction: column; align-items: center; gap: 9px;
    padding: 14px 10px;
    background: ${p => p.$sel ? 'rgba(8,205,0,0.09)' : '#0e140e'};
    border: 1.5px solid ${p => p.$sel ? 'rgba(8,205,0,0.45)' : 'rgba(8,205,0,0.1)'};
    border-radius: 12px; cursor: pointer; position: relative;
    transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
    animation: ${cardIn} 0.4s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay: ${p => p.$delay || 0}ms;
    &:hover{border-color:rgba(8,205,0,0.3);background:rgba(8,205,0,0.06);transform:translateY(-2px);}
`;
const Tick = styled.div`
    position:absolute;top:7px;right:7px;width:15px;height:15px;border-radius:50%;
    background:#08cd00;display:flex;align-items:center;justify-content:center;
    font-size:0.5rem;color:#0a0f0a;font-weight:900;
`;
const SwName = styled.div`font-size:0.78rem;font-weight:700;color:#e8f5e8;letter-spacing:-0.01em;`;
const SwDesc = styled.div`font-size:0.63rem;color:#3d5c3d;line-height:1.3;text-align:center;`;
const Card = styled.div`
    background:#0e140e;border:1px solid rgba(8,205,0,0.1);border-radius:12px;padding:18px;margin-bottom:12px;
`;
const CardTitle = styled.div`font-size:0.78rem;font-weight:600;color:#7aab78;margin-bottom:10px;`;
const Sel = styled.select`
    width:100%;background:#0a0f0a;border:1px solid rgba(8,205,0,0.14);border-radius:8px;
    color:#e8f5e8;font-size:0.8rem;font-family:'Inter',sans-serif;
    padding:8px 32px 8px 10px;outline:none;cursor:pointer;transition:border-color 0.15s;
    appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%233d5c3d' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat:no-repeat;background-position:right 10px center;
    &:hover,&:focus{border-color:rgba(8,205,0,0.3);}
    option{background:#0a0f0a;}
    &:disabled{opacity:0.45;cursor:default;}
`;
const DangerBox = styled.div`
    background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.16);
    border-radius:10px;padding:14px 16px;display:flex;align-items:flex-start;gap:12px;
`;
const DangerIcon = styled.div`color:#ef4444;font-size:0.85rem;flex-shrink:0;margin-top:1px;`;
const CheckRow = styled.label`
    display:flex;align-items:center;gap:8px;font-size:0.775rem;color:#4b5563;
    cursor:pointer;user-select:none;line-height:1.5;
    input{accent-color:#ef4444;cursor:pointer;flex-shrink:0;}
`;
const Footer = styled.div`display:flex;align-items:center;justify-content:space-between;margin-top:20px;`;
const PoweredBy = styled.span`font-size:0.68rem;color:#1e2e1e;`;
const Btn = styled.button`
    padding:9px 24px;background:#08cd00;border:none;border-radius:8px;
    color:#0a0f0a;font-size:0.8rem;font-weight:700;font-family:'Inter',sans-serif;
    cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:8px;
    &:hover:not(:disabled){background:#07b300;transform:translateY(-1px);}
    &:disabled{opacity:0.4;cursor:default;transform:none;}
`;
const Dots = styled.div`display:inline-flex;align-items:center;gap:4px;`;
const Dot = styled.span<{ $d: number }>`
    width:5px;height:5px;border-radius:50%;background:#0a0f0a;
    animation:${dotBounce} 1.2s ease-in-out infinite;animation-delay:${p => p.$d}s;
`;
const Toast = styled.div<{ $ok?: boolean }>`
    display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;
    font-size:0.775rem;font-weight:500;margin-bottom:18px;
    animation:${fadeUp} 0.3s ease both;
    ${p => p.$ok
        ? 'background:rgba(8,205,0,0.09);border:1px solid rgba(8,205,0,0.25);color:#08cd00;'
        : 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;'
    }
`;

/* ─── Fetchers ───────────────────────────────────────────────── */
async function fetchPaper() { const r = await fetch('https://api.papermc.io/v2/projects/paper'); const d = await r.json(); return [...(d.versions||[])].reverse() as string[]; }
async function fetchPurpur() { const r = await fetch('https://api.purpurmc.org/v2/purpur'); const d = await r.json(); return [...(d.versions||[])].reverse() as string[]; }
async function fetchVanilla() { const r = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json'); const d = await r.json(); return (d.versions as any[]).filter(v=>v.type==='release').map(v=>v.id) as string[]; }
async function fetchFabric() { const r = await fetch('https://meta.fabricmc.net/v2/versions/game'); const d = await r.json() as any[]; return d.filter(v=>v.stable).map(v=>v.version) as string[]; }

export default function VersionChangerContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const [sw, setSw] = useState<Software>('paper');
    const [versions, setVersions] = useState<string[]>([]);
    const [sel, setSel] = useState('');
    const [reset, setReset] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const load = useCallback(async () => {
        setFetching(true); setVersions([]); setSel('');
        try {
            let v: string[] = [];
            if (sw==='paper') v = await fetchPaper();
            else if (sw==='purpur') v = await fetchPurpur();
            else if (sw==='vanilla') v = await fetchVanilla();
            else if (sw==='fabric') v = await fetchFabric();
            else v = await fetchPaper();
            setVersions(v); setSel(v[0]||'');
        } catch { setVersions([]); }
        finally { setFetching(false); }
    }, [sw]);

    useEffect(() => { load(); }, [load]);

    const install = async () => {
        if (!sel) return;
        setLoading(true); setToast(null);
        try {
            await updateStartupVariable(uuid, 'MINECRAFT_VERSION', sel);
            await updateStartupVariable(uuid, 'BUILD_NUMBER', 'latest');
            if (reset) await reinstallServer(uuid);
            setToast({ msg: `${SOFTWARE.find(s=>s.id===sw)?.label} ${sel} installed.`, ok: true });
        } catch (e: any) {
            setToast({ msg: e?.message || 'Failed to update version.', ok: false });
        } finally { setLoading(false); }
    };

    return (
        <Page>
            {toast && <Toast $ok={toast.ok}><FontAwesomeIcon icon={toast.ok ? faCheckCircle : faExclamationTriangle}/> {toast.msg}</Toast>}
            <Heading>Version Changer</Heading>
            <Sub>Switch your server software and Minecraft version with one click.</Sub>

            <Grid>
                {SOFTWARE.map(({ id, label, Logo, desc }, i) => (
                    <SoftCard key={id} $sel={sw===id} $delay={i*45} onClick={()=>setSw(id)}>
                        {sw===id && <Tick>✓</Tick>}
                        <Logo/>
                        <div><SwName>{label}</SwName><SwDesc>{desc}</SwDesc></div>
                    </SoftCard>
                ))}
            </Grid>

            <Card>
                <CardTitle>Minecraft Version</CardTitle>
                <Sel value={sel} onChange={e=>setSel(e.target.value)} disabled={fetching||!versions.length}>
                    {fetching ? <option>Fetching...</option>
                    : !versions.length ? <option>No versions</option>
                    : versions.map(v=><option key={v} value={v}>{v}</option>)}
                </Sel>
            </Card>

            <DangerBox>
                <DangerIcon><FontAwesomeIcon icon={faExclamationTriangle}/></DangerIcon>
                <div>
                    <div style={{fontSize:'0.775rem',fontWeight:700,color:'#ef4444',marginBottom:'7px'}}>Danger Zone</div>
                    <CheckRow><input type='checkbox' checked={reset} onChange={e=>setReset(e.target.checked)}/> Reset the server and delete all files</CheckRow>
                </div>
            </DangerBox>

            <Footer>
                <PoweredBy>Powered by <span style={{color:'#08cd00'}}>AquiaTheme</span></PoweredBy>
                <Btn onClick={install} disabled={loading||!sel||fetching}>
                    {loading ? <Dots><Dot $d={0}/><Dot $d={0.16}/><Dot $d={0.32}/></Dots> : 'Install'}
                </Btn>
            </Footer>
        </Page>
    );
}
