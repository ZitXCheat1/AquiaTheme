import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components/macro';
import { keyframes } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faDownload, faStar, faExternalLinkAlt,
    faSync, faTrash, faPlug, faBoxOpen, faCubes,
} from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import deleteFiles from '@/api/server/files/deleteFiles';
import pullFile from '@/api/server/files/pullFile';

/* ─── Grass Block missing icon ───────────────────────────────── */
const GrassBlockIcon = () => (
    <svg viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
        {/* Top face */}
        <polygon points="32,4 60,20 32,36 4,20" fill="#5d9e2f"/>
        <polygon points="32,6 58,21 32,34 6,21" fill="#6abf38"/>
        {/* Side face left */}
        <polygon points="4,20 32,36 32,60 4,44" fill="#8B6144"/>
        <polygon points="6,21 30,36 30,58 6,43" fill="#7a5538" opacity="0.6"/>
        {/* Side face right */}
        <polygon points="60,20 32,36 32,60 60,44" fill="#7a5032"/>
        {/* Dirt shade */}
        <polygon points="32,36 32,60 60,44 60,20" fill="#6b4427" opacity="0.3"/>
        {/* Grass highlight */}
        <polygon points="32,4 60,20 32,36 4,20" fill="#78d43a" opacity="0.25"/>
    </svg>
);

/* ─── Cube wireframe loader ──────────────────────────────────── */
const CubeLoader = () => (
    <svg viewBox="0 0 48 48" width="32" height="32" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'aqSpin 2s linear infinite' }}>
        <polygon points="24,4 44,15 44,33 24,44 4,33 4,15" fill="none" stroke="#08cd00" strokeWidth="1.5" opacity="0.6"/>
        <line x1="24" y1="4" x2="24" y2="24" stroke="#08cd00" strokeWidth="1" opacity="0.4"/>
        <line x1="44" y1="15" x2="24" y2="24" stroke="#08cd00" strokeWidth="1" opacity="0.4"/>
        <line x1="4"  y1="15" x2="24" y2="24" stroke="#08cd00" strokeWidth="1" opacity="0.4"/>
    </svg>
);

/* ─── Types ─────────────────────────────────────────────────── */
interface Plugin {
    id: string;
    name: string;
    author: string;
    description: string;
    icon: string | null;
    downloads: number;
    stars: number;
    updated: string;
    source: 'modrinth' | 'hangar' | 'spigot' | 'modpack';
    url: string;
    // Identifiers used to resolve a direct download URL at install time.
    projectId?: string; // modrinth project id / slug
    owner?: string; // hangar project owner
    slug?: string; // hangar project slug
}

/* ─── Keyframes ──────────────────────────────────────────────── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}`;
const dotBounce = keyframes`0%,80%,100%{transform:scale(0.35);opacity:0.25;}40%{transform:scale(1);opacity:1;}`;
const cardIn = keyframes`from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}`;

/* ─── Styled ─────────────────────────────────────────────────── */
const Page = styled.div`
    padding: 24px;
    min-height: calc(100vh - 3.5rem);
    color: #ffffff;
    font-family: 'Inter', sans-serif;
    animation: ${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
`;

const TopBar = styled.div`
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
`;

const SearchWrap = styled.div`
    flex: 1; position: relative;
    svg { position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:0.8rem; }
`;

const SearchInput = styled.input`
    width: 100%;
    background: #0e140e;
    border: 1px solid rgba(8,205,0,0.14);
    border-radius: 8px;
    padding: 9px 12px 9px 33px;
    color: #ffffff;
    font-size: 0.825rem;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.15s;
    &::placeholder { color: #2a3d2a; }
    &:focus { border-color: rgba(8,205,0,0.35); box-shadow: 0 0 0 3px rgba(8,205,0,0.06); }
`;

const RefreshBtn = styled.button`
    width: 36px; height: 36px;
    border-radius: 8px;
    background: #0e140e;
    border: 1px solid rgba(8,205,0,0.14);
    color: #94a3b8;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem;
    transition: all 0.15s;
    &:hover { border-color: rgba(8,205,0,0.3); color: #08cd00; }
    &:disabled { opacity: 0.4; cursor: default; }
`;

const TabRow = styled.div`
    display: flex;
    gap: 2px;
    margin-bottom: 18px;
    background: #0e140e;
    border: 1px solid rgba(8,205,0,0.1);
    border-radius: 10px;
    padding: 4px;
    width: fit-content;
`;

const TabBtn = styled.button<{ $active?: boolean }>`
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 7px;
    font-size: 0.78rem; font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer; border: none;
    transition: all 0.15s;
    ${p => p.$active
        ? 'background:#08cd00;color:#0a0f0a;font-weight:700;'
        : 'background:transparent;color:#94a3b8;&:hover{color:#7aab78;}'
    }
`;

const CountBadge = styled.span`
    background: rgba(8,205,0,0.2);
    color: #08cd00;
    border-radius: 10px;
    padding: 1px 7px;
    font-size: 0.65rem;
    font-weight: 700;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 10px;
`;

const Card = styled.div<{ $delay?: number }>`
    background: #0e140e;
    border: 1px solid rgba(8,205,0,0.1);
    border-radius: 10px;
    padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
    transition: border-color 0.15s, transform 0.15s;
    animation: ${cardIn} 0.4s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay: ${p => p.$delay || 0}ms;
    &:hover { border-color: rgba(8,205,0,0.25); transform: translateY(-1px); }
`;

const CardTop = styled.div`display:flex;align-items:flex-start;gap:12px;`;

const PluginIcon = styled.div`
    width: 42px; height: 42px; border-radius: 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden; color: #ffffff; font-size: 1rem;
    img { width:100%;height:100%;object-fit:cover;border-radius:9px; }
`;

const CardInfo = styled.div`flex:1;min-width:0;`;

const CardName = styled.div`
    font-size: 0.875rem; font-weight: 600; color: #ffffff;
    display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
    a { color:inherit;text-decoration:none;&:hover{color:#08cd00;} }
`;

const SourceBadge = styled.span<{ $src: string }>`
    font-size: 0.6rem; font-weight: 700;
    padding: 2px 5px; border-radius: 4px;
    text-transform: uppercase; letter-spacing: 0.05em;
    ${p => p.$src === 'modrinth' && 'background:rgba(27,217,106,0.1);color:#1bd96a;'}
    ${p => p.$src === 'hangar'   && 'background:rgba(8,205,0,0.1);color:#08cd00;'}
    ${p => p.$src === 'spigot'   && 'background:rgba(251,191,36,0.1);color:#fbbf24;'}
    ${p => p.$src === 'modpack'  && 'background:rgba(168,85,247,0.1);color:#a855f7;'}
`;

const CardAuthor = styled.div`font-size:0.72rem;color:#94a3b8;margin-top:2px;`;

const CardDesc = styled.p`
    font-size:0.775rem;color:#4b6b4b;margin:0;line-height:1.5;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
`;

const CardMeta = styled.div`
    display:flex;align-items:center;gap:12px;font-size:0.7rem;color:#94a3b8;
`;

const MetaItem = styled.span`
    display:flex;align-items:center;gap:4px;
    svg { color:#e2e8f0; }
`;

const InstallBtn = styled.button<{ $installed?: boolean }>`
    margin-top:4px;
    padding: 6px 14px; border-radius: 6px;
    font-size: 0.72rem; font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer; border: 1px solid transparent;
    transition: all 0.15s; align-self: flex-end;
    display: inline-flex; align-items: center; gap: 6px;
    ${p => p.$installed
        ? 'background:rgba(8,205,0,0.1);border-color:rgba(8,205,0,0.3);color:#08cd00;cursor:default;'
        : 'background:#08cd00;border-color:#08cd00;color:#0a0f0a;font-weight:700;&:hover{background:#07b300;}'
    }
    &:disabled { cursor: default; }
`;

const ErrorBanner = styled.div`
    display:flex;align-items:center;gap:8px;
    background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);
    color:#fca5a5;border-radius:8px;padding:10px 14px;margin-bottom:14px;
    font-size:0.775rem;
`;

/* Installed tab */
const InstalledRow = styled.div<{ $delay?: number }>`
    background: #0e140e; border: 1px solid rgba(8,205,0,0.1);
    border-radius: 10px; padding: 12px 14px;
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 6px; transition: border-color 0.15s;
    animation: ${cardIn} 0.35s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay: ${p => p.$delay || 0}ms;
    &:hover { border-color: rgba(8,205,0,0.22); }
`;

const IIcon = styled.div`
    width:40px;height:40px;border-radius:10px;
    background:rgba(255,255,255,0.06);
    border:1px solid rgba(255,255,255,0.08);
    display:flex;align-items:center;justify-content:center;
    color:#ffffff;font-size:0.95rem;flex-shrink:0;
`;

const IInfo = styled.div`flex:1;min-width:0;`;
const IName = styled.div`font-size:0.85rem;font-weight:600;color:#ffffff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const IMeta = styled.div`font-size:0.7rem;color:#94a3b8;margin-top:2px;`;

const DelBtn = styled.button`
    width:32px;height:32px;border-radius:7px;
    background:rgba(239,68,68,0.07);
    border:1px solid rgba(239,68,68,0.18);
    color:#ef4444;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-size:0.75rem;transition:all 0.15s;flex-shrink:0;
    &:hover{background:rgba(239,68,68,0.16);}
    &:disabled{opacity:0.35;cursor:default;}
`;

/* Loading / empty */
const Dots = styled.div`display:inline-flex;align-items:center;gap:5px;`;
const Dot = styled.span<{ $d: number }>`
    width:6px;height:6px;border-radius:50%;background:#08cd00;
    animation:${dotBounce} 1.2s ease-in-out infinite;animation-delay:${p=>p.$d}s;
`;

const LoadingState = styled.div`
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:64px 20px;gap:14px;color:#94a3b8;font-size:0.825rem;
`;

const EmptyState = styled.div`
    text-align:center;padding:64px 20px;
    color:#2a3d2a;font-size:0.825rem;
`;

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt = (n: number) => n>=1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n>=1_000 ? `${(n/1_000).toFixed(1)}k` : String(n);

const rel = (iso: string) => {
    const d = Math.floor((Date.now()-new Date(iso).getTime())/86_400_000);
    if (d===0) return 'today';
    if (d===1) return 'yesterday';
    if (d<30) return `${d}d ago`;
    const m = Math.floor(d/30);
    if (m<12) return `${m}mo ago`;
    return `${Math.floor(m/12)}y ago`;
};

const fmtBytes = (b: number) => b>=1048576 ? `${(b/1048576).toFixed(1)} MiB` : b>=1024 ? `${(b/1024).toFixed(1)} KiB` : `${b} B`;

/* ─── API helpers ────────────────────────────────────────────── */
async function fetchModrinth(query: string, type: 'plugin' | 'modpack'): Promise<Plugin[]> {
    try {
        const facets = JSON.stringify([[ `project_type:${type}`]]);
        const params = new URLSearchParams({ query, limit: '40', facets });
        const res = await fetch(`https://api.modrinth.com/v2/search?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.hits || []).map((h: any) => ({
            id: `modrinth-${h.project_id}`,
            name: h.title,
            author: h.author,
            description: h.description,
            icon: h.icon_url || null,
            downloads: h.downloads || 0,
            stars: h.follows || 0,
            updated: h.date_modified,
            source: type === 'modpack' ? 'modpack' as const : 'modrinth' as const,
            url: `https://modrinth.com/${type}/${h.slug}`,
            projectId: h.project_id || h.slug,
        }));
    } catch { return []; }
}

async function fetchHangar(query: string): Promise<Plugin[]> {
    try {
        // Hangar's search param is `q`, and it sorts with `-downloads`. Passing an
        // invalid `category` (e.g. "plugins") makes the API return zero results.
        const params = new URLSearchParams({ limit: '25', offset: '0', sort: '-downloads' });
        if (query) params.set('q', query);
        const res = await fetch(`https://hangar.papermc.io/api/v1/projects?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.result || []).map((p: any) => ({
            id: `hangar-${p.namespace?.owner}-${p.name}`,
            name: p.name,
            author: p.namespace?.owner || 'Unknown',
            description: p.description || '',
            icon: p.avatarUrl || `https://hangar.papermc.io/api/v1/projects/${p.namespace?.owner}/${p.namespace?.slug || p.name}/icon`,
            downloads: p.stats?.downloads || 0,
            stars: p.stats?.stars || 0,
            updated: p.lastUpdated || new Date().toISOString(),
            source: 'hangar' as const,
            url: `https://hangar.papermc.io/${p.namespace?.owner}/${p.name}`,
            owner: p.namespace?.owner,
            slug: p.namespace?.slug || p.name,
        }));
    } catch { return []; }
}

/* ─── Install resolvers ──────────────────────────────────────── */
/* Resolve a direct .jar download URL + filename for a plugin so wings can pull it. */
async function resolveDownload(plugin: Plugin): Promise<{ url: string; filename: string }> {
    if (plugin.source === 'modrinth' || plugin.source === 'modpack') {
        if (!plugin.projectId) throw new Error('Missing project id.');
        const res = await fetch(`https://api.modrinth.com/v2/project/${plugin.projectId}/version`);
        if (!res.ok) throw new Error('Could not load versions from Modrinth.');
        const versions = await res.json();
        if (!Array.isArray(versions) || versions.length === 0) throw new Error('No downloadable versions found.');
        // Prefer the primary file of the latest version.
        const files = versions[0].files || [];
        const file = files.find((f: any) => f.primary) || files[0];
        if (!file?.url) throw new Error('No downloadable file found.');
        return { url: file.url, filename: file.filename || `${plugin.slug || plugin.name}.jar` };
    }

    if (plugin.source === 'hangar') {
        if (!plugin.owner || !plugin.slug) throw new Error('Missing Hangar project reference.');
        const verRes = await fetch(
            `https://hangar.papermc.io/api/v1/projects/${plugin.owner}/${plugin.slug}/latestrelease`
        );
        if (!verRes.ok) throw new Error('Could not load latest Hangar release.');
        const version = (await verRes.text()).trim().replace(/^"|"$/g, '');
        if (!version) throw new Error('No released version found.');
        const url = `https://hangar.papermc.io/api/v1/projects/${plugin.owner}/${plugin.slug}/versions/${version}/PAPER/download`;
        return { url, filename: `${plugin.slug}-${version}.jar` };
    }

    throw new Error('This source cannot be installed automatically.');
}

/* ─── Main component ─────────────────────────────────────────── */
export default function PluginsContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const [tab, setTab] = useState<'browse' | 'modpacks' | 'installed'>('browse');
    const [query, setQuery] = useState('');
    const [debQuery, setDebQuery] = useState('');
    const [results, setResults] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(false);
    const [installState, setInstallState] = useState<Record<string, 'installing' | 'done' | 'error'>>({});
    const [installError, setInstallError] = useState<string | null>(null);
    const [installedFiles, setInstalledFiles] = useState<FileObject[]>([]);
    const [loadingInstalled, setLoadingInstalled] = useState(false);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebQuery(query), 400);
        return () => clearTimeout(t);
    }, [query]);

    const fetchBrowse = useCallback(async (type: 'plugin' | 'modpack') => {
        setLoading(true);
        const [mr, hg] = await Promise.all([
            fetchModrinth(debQuery, type),
            type === 'plugin' ? fetchHangar(debQuery) : Promise.resolve([]),
        ]);
        const merged = [...mr, ...hg].sort((a, b) => b.downloads - a.downloads);
        setResults(merged);
        setLoading(false);
    }, [debQuery]);

    useEffect(() => {
        if (tab === 'browse') fetchBrowse('plugin');
        else if (tab === 'modpacks') fetchBrowse('modpack');
    }, [tab, fetchBrowse]);

    const loadInstalled = useCallback(async () => {
        setLoadingInstalled(true);
        try {
            const files = await loadDirectory(uuid, '/plugins');
            setInstalledFiles(files.filter(f => f.isFile && f.name.endsWith('.jar')));
        } catch { setInstalledFiles([]); }
        finally { setLoadingInstalled(false); }
    }, [uuid]);

    useEffect(() => {
        if (tab === 'installed') loadInstalled();
    }, [tab, loadInstalled]);

    const handleInstall = useCallback(async (plugin: Plugin) => {
        setInstallError(null);
        setInstallState((s) => ({ ...s, [plugin.id]: 'installing' }));
        try {
            const { url, filename } = await resolveDownload(plugin);
            await pullFile(uuid, url, '/plugins', filename);
            setInstallState((s) => ({ ...s, [plugin.id]: 'done' }));
            // Refresh the installed list in the background so the count/badge stays accurate.
            loadDirectory(uuid, '/plugins')
                .then((files) => setInstalledFiles(files.filter((f) => f.isFile && f.name.endsWith('.jar'))))
                .catch(() => undefined);
        } catch (e: any) {
            setInstallState((s) => ({ ...s, [plugin.id]: 'error' }));
            setInstallError(e?.message || `Failed to install ${plugin.name}.`);
        }
    }, [uuid]);

    const handleDelete = async (name: string) => {
        setDeletingFile(name);
        try {
            await deleteFiles(uuid, '/plugins', [name]);
            setInstalledFiles(f => f.filter(p => p.name !== name));
        } finally { setDeletingFile(null); }
    };

    const isModpackTab = tab === 'modpacks';

    return (
        <Page>
            <TabRow>
                <TabBtn $active={tab==='browse'} onClick={()=>setTab('browse')}>
                    <FontAwesomeIcon icon={faSearch} style={{fontSize:'0.75rem'}}/>
                    Plugins
                </TabBtn>
                <TabBtn $active={tab==='modpacks'} onClick={()=>setTab('modpacks')}>
                    <FontAwesomeIcon icon={faCubes} style={{fontSize:'0.75rem'}}/>
                    Modpacks
                </TabBtn>
                <TabBtn $active={tab==='installed'} onClick={()=>setTab('installed')}>
                    <FontAwesomeIcon icon={faBoxOpen} style={{fontSize:'0.75rem'}}/>
                    Installed
                    {installedFiles.length > 0 && <CountBadge>{installedFiles.length}</CountBadge>}
                </TabBtn>
            </TabRow>

            <div key={tab} className='aq-tab-content'>
            {tab === 'installed' ? (
                loadingInstalled ? (
                    <LoadingState>
                        <Dots><Dot $d={0}/><Dot $d={0.16}/><Dot $d={0.32}/></Dots>
                        Loading installed plugins...
                    </LoadingState>
                ) : installedFiles.length === 0 ? (
                    <EmptyState>No .jar files found in /plugins directory.</EmptyState>
                ) : (
                    <div>
                        {installedFiles.map((file, i) => (
                            <InstalledRow key={file.name} $delay={i * 40}>
                                <IIcon><FontAwesomeIcon icon={faPlug}/></IIcon>
                                <IInfo>
                                    <IName>{file.name.replace(/\.jar$/, '')}</IName>
                                    <IMeta>{file.name} &bull; {fmtBytes(file.size)}</IMeta>
                                </IInfo>
                                <DelBtn
                                    onClick={() => handleDelete(file.name)}
                                    disabled={deletingFile === file.name}
                                    title='Delete plugin'
                                >
                                    {deletingFile === file.name
                                        ? <FontAwesomeIcon icon={faSync} spin/>
                                        : <FontAwesomeIcon icon={faTrash}/>
                                    }
                                </DelBtn>
                            </InstalledRow>
                        ))}
                    </div>
                )
            ) : (
                <>
                    <TopBar>
                        <SearchWrap>
                            <FontAwesomeIcon icon={faSearch}/>
                            <SearchInput
                                type='text'
                                placeholder={isModpackTab ? 'Search modpacks...' : 'Search plugins...'}
                                value={query}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                            />
                        </SearchWrap>
                        <RefreshBtn onClick={() => fetchBrowse(isModpackTab ? 'modpack' : 'plugin')} disabled={loading}>
                            <FontAwesomeIcon icon={faSync} spin={loading}/>
                        </RefreshBtn>
                    </TopBar>

                    {installError && <ErrorBanner>{installError}</ErrorBanner>}

                    {loading ? (
                        <LoadingState>
                            <CubeLoader/>
                            <span style={{marginLeft: 10}}>{isModpackTab ? 'Searching modpacks...' : 'Searching plugins...'}</span>
                        </LoadingState>
                    ) : results.length === 0 ? (
                        <EmptyState>
                            {isModpackTab ? 'No modpacks found.' : 'No plugins found.'} Try a different search.
                        </EmptyState>
                    ) : (
                        <Grid>
                            {results.map((plugin, i) => (
                                <PluginCard
                                    key={plugin.id}
                                    plugin={plugin}
                                    status={installState[plugin.id]}
                                    delay={i * 35}
                                    onInstall={() => handleInstall(plugin)}
                                />
                            ))}
                        </Grid>
                    )}
                </>
            )}
            </div>
        </Page>
    );
}

/* ─── Plugin card ────────────────────────────────────────────── */
function PluginCard({ plugin, status, onInstall, delay }: {
    plugin: Plugin;
    status?: 'installing' | 'done' | 'error';
    onInstall: () => void;
    delay?: number;
}) {
    const installing = status === 'installing';
    const done = status === 'done';
    return (
        <Card $delay={delay}>
            <CardTop>
                <PluginIcon>
                    {plugin.icon
                        ? <img src={plugin.icon} alt={plugin.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style'); }}/>
                        : null
                    }
                    {!plugin.icon && <GrassBlockIcon/>}
                </PluginIcon>
                <CardInfo>
                    <CardName>
                        <a href={plugin.url} target='_blank' rel='noopener noreferrer'>{plugin.name}</a>
                        <a href={plugin.url} target='_blank' rel='noopener noreferrer' style={{color:'#cbd5e1'}}>
                            <FontAwesomeIcon icon={faExternalLinkAlt} style={{fontSize:'0.6rem'}}/>
                        </a>
                        <SourceBadge $src={plugin.source}>{plugin.source}</SourceBadge>
                    </CardName>
                    <CardAuthor>by {plugin.author}</CardAuthor>
                </CardInfo>
            </CardTop>

            <CardDesc>{plugin.description}</CardDesc>

            <CardMeta>
                <MetaItem><FontAwesomeIcon icon={faDownload}/> {fmt(plugin.downloads)}</MetaItem>
                <MetaItem><FontAwesomeIcon icon={faStar}/> {fmt(plugin.stars)}</MetaItem>
                <MetaItem>{rel(plugin.updated)}</MetaItem>
            </CardMeta>

            <InstallBtn
                $installed={done}
                disabled={installing || done}
                onClick={() => !installing && !done && onInstall()}
            >
                {installing
                    ? <><FontAwesomeIcon icon={faSync} spin/> Installing</>
                    : done
                    ? <><FontAwesomeIcon icon={faBoxOpen}/> Installed</>
                    : status === 'error'
                    ? 'Retry'
                    : <><FontAwesomeIcon icon={faDownload}/> Install</>
                }
            </InstallBtn>
        </Card>
    );
}
