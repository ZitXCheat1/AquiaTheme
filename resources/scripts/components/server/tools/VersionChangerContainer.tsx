import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components/macro';
import { keyframes } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import reinstallServer from '@/api/server/reinstallServer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faCheck } from '@fortawesome/free-solid-svg-icons';

type Software = 'paper' | 'purpur' | 'vanilla' | 'spigot' | 'fabric' | 'forge';

/* ─── SVG Logos ──────────────────────────────────────────────── */
/* Real project logos loaded from CDN */
const LOGO_URLS: Record<Software, string> = {
    paper:   'https://docs.papermc.io/img/paper.png',
    purpur:  'https://raw.githubusercontent.com/PurpurMC/Purpur/ver/1.21/art/purpur-small.png',
    vanilla: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/MC_JAVA_EDITION_keyart_1200x600_v02.jpg',
    spigot:  'https://static.spigotmc.org/img/spigot.png',
    fabric:  'https://fabricmc.net/assets/logo.png',
    forge:   'https://files.minecraftforge.net/images/forge_logo.png',
};

/* Fallback colored squares if CDN fails */
const LOGO_COLORS: Record<Software, string> = {
    paper: '#e8e8e8', purpur: '#9333ea', vanilla: '#5b9e3b',
    spigot: '#f59e0b', fabric: '#bef264', forge: '#c2410c',
};

const LogoImg = ({ id }: { id: Software }) => {
    const [err, setErr] = React.useState(false);
    if (err) {
        return (
            <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: LOGO_COLORS[id], opacity: 0.85,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontWeight: 700, color: '#0a0f0a',
            }}>
                {id[0].toUpperCase()}
            </div>
        );
    }
    return (
        <img
            src={LOGO_URLS[id]}
            alt={id}
            onError={() => setErr(true)}
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
        />
    );
};

const SOFTWARE: { id: Software; label: string; desc: string; accent: string }[] = [
    { id: 'paper',   label: 'Paper',   desc: 'High-perf Bukkit fork',    accent: '#e2e8f0' },
    { id: 'purpur',  label: 'Purpur',  desc: 'Extra patches & features', accent: '#a855f7' },
    { id: 'vanilla', label: 'Vanilla', desc: 'Official Mojang server',   accent: '#5b9e3b' },
    { id: 'spigot',  label: 'Spigot',  desc: 'CraftBukkit fork',         accent: '#f59e0b' },
    { id: 'fabric',  label: 'Fabric',  desc: 'Lightweight mod loader',   accent: '#bef264' },
    { id: 'forge',   label: 'Forge',   desc: 'Classic mod framework',    accent: '#f97316' },
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
    font-size: 1.05rem; font-weight: 700; color: #ffffff;
    margin: 0 0 4px; letter-spacing: -0.025em;
`;
const Sub = styled.p`font-size: 0.775rem; color: #94a3b8; margin: 0 0 22px;`;
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
const SwName = styled.div`font-size:0.78rem;font-weight:700;color:#ffffff;letter-spacing:-0.01em;`;
const SwDesc = styled.div`font-size:0.63rem;color:#94a3b8;line-height:1.3;text-align:center;`;
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
    display:flex;align-items:center;gap:10px;font-size:0.775rem;color:#94a3b8;
    cursor:pointer;user-select:none;line-height:1.5;
`;
const CustomCheckbox = styled.div<{ $checked?: boolean }>`
    width:18px;height:18px;border-radius:5px;flex-shrink:0;
    border:1.5px solid ${p => p.$checked ? '#ef4444' : 'rgba(239,68,68,0.25)'};
    background:${p => p.$checked ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.04)'};
    display:flex;align-items:center;justify-content:center;
    transition:all 0.15s;
    svg{opacity:${p => p.$checked ? 1 : 0};transform:scale(${p => p.$checked ? 1 : 0.5});transition:all 0.15s;}
    &:hover{border-color:rgba(239,68,68,0.5);}
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
                {SOFTWARE.map(({ id, label, desc }, i) => (
                    <SoftCard key={id} $sel={sw===id} $delay={i*45} onClick={()=>setSw(id)}>
                        {sw===id && <Tick>✓</Tick>}
                        <LogoImg id={id}/>
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
                    <CheckRow onClick={()=>setReset(!reset)}>
                        <CustomCheckbox $checked={reset}>
                            <FontAwesomeIcon icon={faCheck} style={{fontSize:'0.55rem',color:'#ef4444'}}/>
                        </CustomCheckbox>
                        Reset the server and delete all files
                    </CheckRow>
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
