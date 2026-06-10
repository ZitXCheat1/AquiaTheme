import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faDownload,
    faStar,
    faExternalLinkAlt,
    faFilter,
    faSync,
    faTrash,
    faPlug,
    faBoxOpen,
} from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import deleteFiles from '@/api/server/files/deleteFiles';

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
    source: 'modrinth' | 'hangar' | 'spigot';
    url: string;
    versions?: string[];
    loaders?: string[];
}

/* ─── Styled components ──────────────────────────────────────── */
const Page = styled.div`
    display: flex;
    gap: 16px;
    padding: 24px;
    min-height: calc(100vh - 3.5rem);
    color: #e2e8f0;
`;

const MainArea = styled.div`
    flex: 1;
    min-width: 0;
`;

const TopBar = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
`;

const SearchWrap = styled.div`
    flex: 1;
    position: relative;

    svg {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #4b5563;
        font-size: 0.85rem;
    }
`;

const SearchInput = styled.input`
    width: 100%;
    background: #13131f;
    border: 1px solid rgba(99, 102, 241, 0.18);
    border-radius: 8px;
    padding: 9px 12px 9px 34px;
    color: #e2e8f0;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: #374151; }

    &:focus {
        border-color: rgba(99, 102, 241, 0.45);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
    }
`;

const ActionBtn = styled.button<{ variant?: 'primary' | 'ghost' }>`
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
    white-space: nowrap;

    ${p => p.variant === 'primary' ? `
        background: #6366f1;
        border-color: #6366f1;
        color: white;
        &:hover { background: #5558e8; border-color: #5558e8; }
    ` : `
        background: #13131f;
        border-color: rgba(99, 102, 241, 0.18);
        color: #94a3b8;
        &:hover { border-color: rgba(99, 102, 241, 0.35); color: #e2e8f0; }
    `}

    &:disabled { opacity: 0.5; cursor: default; }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 12px;
`;

const Card = styled.div`
    background: #13131f;
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 10px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: border-color 0.15s;

    &:hover { border-color: rgba(99, 102, 241, 0.3); }
`;

const CardTop = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
`;

const PluginIcon = styled.div`
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
    }
`;

const IconPlaceholder = styled.div`
    width: 24px;
    height: 24px;
    background: rgba(99, 102, 241, 0.3);
    border-radius: 4px;
`;

const CardInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const CardName = styled.div`
    font-size: 0.9rem;
    font-weight: 600;
    color: #e2e8f0;
    display: flex;
    align-items: center;
    gap: 6px;

    a {
        color: inherit;
        text-decoration: none;
        &:hover { color: #818cf8; }
    }
`;

const CardAuthor = styled.div`
    font-size: 0.75rem;
    color: #4b5563;
    margin-top: 2px;
`;

const SourceBadge = styled.span<{ src: string }>`
    font-size: 0.62rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    ${p => p.src === 'modrinth' && `background: rgba(27,217,106,0.12); color: #1bd96a;`}
    ${p => p.src === 'hangar' && `background: rgba(99,102,241,0.15); color: #818cf8;`}
    ${p => p.src === 'spigot' && `background: rgba(251,191,36,0.12); color: #fbbf24;`}
`;

const CardDesc = styled.p`
    font-size: 0.78rem;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const CardMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 0.72rem;
    color: #374151;
`;

const MetaItem = styled.span`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const CardFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 2px;
`;

const VersionSelect = styled.select`
    background: #1a1a2b;
    border: 1px solid rgba(99, 102, 241, 0.18);
    border-radius: 6px;
    color: #94a3b8;
    font-size: 0.75rem;
    padding: 5px 8px;
    outline: none;
    cursor: pointer;
    flex: 1;
    transition: border-color 0.15s;

    &:hover { border-color: rgba(99, 102, 241, 0.35); }
    &:focus { border-color: rgba(99, 102, 241, 0.5); }
`;

const InstallBtn = styled.button<{ installed?: boolean }>`
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;

    ${p => p.installed ? `
        background: rgba(34,197,94,0.12);
        border-color: rgba(34,197,94,0.3);
        color: #22c55e;
        cursor: default;
    ` : `
        background: #6366f1;
        border-color: #6366f1;
        color: white;
        &:hover { background: #5558e8; border-color: #5558e8; }
    `}
`;

/* ─── Filter sidebar ─────────────────────────────────────────── */
const FilterPanel = styled.div`
    width: 200px;
    flex-shrink: 0;
`;

const FilterSection = styled.div`
    margin-bottom: 20px;
`;

const FilterTitle = styled.div`
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #374151;
    margin-bottom: 8px;
    padding: 0 4px;
`;

const FilterItem = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 4px;
    font-size: 0.8rem;
    color: #64748b;
    cursor: pointer;
    border-radius: 6px;
    transition: color 0.12s;

    &:hover { color: #94a3b8; }

    input[type='checkbox'] {
        width: 14px;
        height: 14px;
        accent-color: #6366f1;
        cursor: pointer;
        flex-shrink: 0;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: #374151;
    font-size: 0.875rem;
`;

const LoadingRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    color: #374151;
    font-size: 0.875rem;
    gap: 10px;
`;

/* Tab bar */
const TabBar = styled.div`
    display: flex;
    gap: 2px;
    margin-bottom: 18px;
    background: #13131f;
    border: 1px solid rgba(99,102,241,0.14);
    border-radius: 10px;
    padding: 4px;
    width: fit-content;
`;

const Tab = styled.button<{ active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 14px;
    border-radius: 7px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.15s;

    ${p => p.active
        ? 'background: #6366f1; color: white;'
        : 'background: transparent; color: #64748b; &:hover { color: #94a3b8; }'
    }
`;

/* Installed plugin row */
const InstalledRow = styled.div`
    background: #13131f;
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 8px;
    transition: border-color 0.15s;
    &:hover { border-color: rgba(99,102,241,0.25); }
`;

const InstalledIcon = styled.div`
    width: 42px;
    height: 42px;
    border-radius: 8px;
    background: rgba(99,102,241,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6366f1;
    font-size: 1rem;
    flex-shrink: 0;
`;

const InstalledInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const InstalledName = styled.div`
    font-size: 0.875rem;
    font-weight: 600;
    color: #e2e8f0;
`;

const InstalledMeta = styled.div`
    font-size: 0.72rem;
    color: #4b5563;
    margin-top: 2px;
`;

const DeleteBtn = styled.button`
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    color: #ef4444;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    transition: all 0.15s;
    flex-shrink: 0;

    &:hover { background: rgba(239,68,68,0.18); }
    &:disabled { opacity: 0.4; cursor: default; }
`;

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
};

const relativeTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
};

const MC_VERSIONS = ['1.21', '1.20', '1.19', '1.18', '1.17', '1.16', '1.15'];
const LOADERS = ['Paper', 'Spigot', 'Bukkit', 'Folia', 'Purpur', 'Velocity', 'Bungeecord', 'Sponge'];
const PLATFORMS = ['Modrinth', 'Hangar', 'Spigot'];

/* ─── Main component ─────────────────────────────────────────── */
export default function PluginsContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const [tab, setTab] = useState<'browse' | 'installed'>('browse');
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [platforms, setPlatforms] = useState<string[]>(['Modrinth', 'Hangar']);
    const [versions, setVersions] = useState<string[]>([]);
    const [loaders, setLoaders] = useState<string[]>([]);
    const [results, setResults] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(false);
    const [installed, setInstalled] = useState<Record<string, string>>({});
    const [installedFiles, setInstalledFiles] = useState<FileObject[]>([]);
    const [loadingInstalled, setLoadingInstalled] = useState(false);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);

    /* debounce query */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(t);
    }, [query]);

    const toggleArr = (arr: string[], set: (v: string[]) => void, val: string) => {
        set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
    };

    const fetchModrinth = useCallback(async (): Promise<Plugin[]> => {
        try {
            const facets: string[][] = [['project_type:plugin']];
            if (versions.length > 0) facets.push(versions.map(v => `versions:${v.toLowerCase()}`));
            if (loaders.length > 0) facets.push(loaders.map(l => `categories:${l.toLowerCase()}`));

            const params = new URLSearchParams({
                query: debouncedQuery,
                limit: '20',
                facets: JSON.stringify(facets),
            });

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
                source: 'modrinth' as const,
                url: `https://modrinth.com/plugin/${h.slug}`,
                versions: h.versions || [],
                loaders: h.categories || [],
            }));
        } catch {
            return [];
        }
    }, [debouncedQuery, versions, loaders]);

    const fetchHangar = useCallback(async (): Promise<Plugin[]> => {
        try {
            const params = new URLSearchParams({
                query: debouncedQuery,
                limit: '20',
                category: 'plugins',
            });

            const res = await fetch(`https://hangar.papermc.io/api/v1/projects?${params}`);
            if (!res.ok) return [];
            const data = await res.json();

            return (data.result || []).map((p: any) => ({
                id: `hangar-${p.namespace?.owner}-${p.name}`,
                name: p.name,
                author: p.namespace?.owner || 'Unknown',
                description: p.description || '',
                icon: p.avatarUrl || null,
                downloads: p.stats?.downloads || 0,
                stars: p.stats?.stars || 0,
                updated: p.lastUpdated || new Date().toISOString(),
                source: 'hangar' as const,
                url: `https://hangar.papermc.io/${p.namespace?.owner}/${p.name}`,
                versions: [],
                loaders: ['Paper', 'Velocity', 'Waterfall'],
            }));
        } catch {
            return [];
        }
    }, [debouncedQuery]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const promises: Promise<Plugin[]>[] = [];
        if (platforms.includes('Modrinth')) promises.push(fetchModrinth());
        if (platforms.includes('Hangar')) promises.push(fetchHangar());

        const arrays = await Promise.all(promises);
        const merged = arrays.flat().sort((a, b) => b.downloads - a.downloads);
        setResults(merged);
        setLoading(false);
    }, [platforms, fetchModrinth, fetchHangar]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const loadInstalledPlugins = useCallback(async () => {
        setLoadingInstalled(true);
        try {
            const files = await loadDirectory(uuid, '/plugins');
            setInstalledFiles(files.filter(f => f.isFile && f.name.endsWith('.jar')));
        } catch {
            setInstalledFiles([]);
        } finally {
            setLoadingInstalled(false);
        }
    }, [uuid]);

    useEffect(() => {
        if (tab === 'installed') loadInstalledPlugins();
    }, [tab, loadInstalledPlugins]);

    const handleDelete = async (name: string) => {
        setDeletingFile(name);
        try {
            await deleteFiles(uuid, '/plugins', [name]);
            setInstalledFiles(f => f.filter(p => p.name !== name));
        } finally {
            setDeletingFile(null);
        }
    };

    const formatBytes = (b: number) => {
        if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MiB`;
        if (b >= 1024) return `${(b / 1024).toFixed(1)} KiB`;
        return `${b} B`;
    };

    return (
        <Page>
            <MainArea>
                <TabBar>
                    <Tab active={tab === 'browse'} onClick={() => setTab('browse')}>
                        <FontAwesomeIcon icon={faSearch} />
                        Browse
                    </Tab>
                    <Tab active={tab === 'installed'} onClick={() => setTab('installed')}>
                        <FontAwesomeIcon icon={faBoxOpen} />
                        Installed Plugins
                        {installedFiles.length > 0 && (
                            <span style={{ background: 'rgba(99,102,241,0.25)', color: '#818cf8', borderRadius: '10px', padding: '1px 7px', fontSize: '0.68rem' }}>
                                {installedFiles.length}
                            </span>
                        )}
                    </Tab>
                </TabBar>

                {tab === 'installed' ? (
                    loadingInstalled ? (
                        <LoadingRow><FontAwesomeIcon icon={faSync} spin /> Loading plugins...</LoadingRow>
                    ) : installedFiles.length === 0 ? (
                        <EmptyState>No .jar files found in /plugins directory.</EmptyState>
                    ) : (
                        <div>
                            {installedFiles.map(file => (
                                <InstalledRow key={file.name}>
                                    <InstalledIcon><FontAwesomeIcon icon={faPlug} /></InstalledIcon>
                                    <InstalledInfo>
                                        <InstalledName>{file.name.replace('.jar', '')}</InstalledName>
                                        <InstalledMeta>{file.name} &bull; {formatBytes(file.size)}</InstalledMeta>
                                    </InstalledInfo>
                                    <DeleteBtn
                                        onClick={() => handleDelete(file.name)}
                                        disabled={deletingFile === file.name}
                                        title='Delete plugin'
                                    >
                                        {deletingFile === file.name
                                            ? <FontAwesomeIcon icon={faSync} spin />
                                            : <FontAwesomeIcon icon={faTrash} />
                                        }
                                    </DeleteBtn>
                                </InstalledRow>
                            ))}
                        </div>
                    )
                ) : (
                    <>
                        <TopBar>
                            <SearchWrap>
                                <FontAwesomeIcon icon={faSearch} />
                                <SearchInput
                                    type='text'
                                    placeholder='Search for a plugin...'
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                />
                            </SearchWrap>
                            <ActionBtn variant='ghost' onClick={fetchAll} disabled={loading}>
                                <FontAwesomeIcon icon={faSync} spin={loading} />
                            </ActionBtn>
                        </TopBar>

                        {loading ? (
                            <LoadingRow>
                                <FontAwesomeIcon icon={faSync} spin />
                                Searching plugins...
                            </LoadingRow>
                        ) : results.length === 0 ? (
                            <EmptyState>
                                No plugins found. Try a different search or select more platforms.
                            </EmptyState>
                        ) : (
                            <Grid>
                                {results.map(plugin => (
                                    <PluginCard
                                        key={plugin.id}
                                        plugin={plugin}
                                        isInstalled={!!installed[plugin.id]}
                                        onInstall={(version) => setInstalled(p => ({ ...p, [plugin.id]: version }))}
                                    />
                                ))}
                            </Grid>
                        )}
                    </>
                )}
            </MainArea>

            <FilterPanel>
                <FilterSection>
                    <FilterTitle>Platform</FilterTitle>
                    {PLATFORMS.map(p => (
                        <FilterItem key={p}>
                            <input
                                type='checkbox'
                                checked={platforms.includes(p)}
                                onChange={() => toggleArr(platforms, setPlatforms, p)}
                            />
                            {p}
                        </FilterItem>
                    ))}
                </FilterSection>

                <FilterSection>
                    <FilterTitle>Version</FilterTitle>
                    {MC_VERSIONS.map(v => (
                        <FilterItem key={v}>
                            <input
                                type='checkbox'
                                checked={versions.includes(v)}
                                onChange={() => toggleArr(versions, setVersions, v)}
                            />
                            {v}
                        </FilterItem>
                    ))}
                </FilterSection>

                <FilterSection>
                    <FilterTitle>Loader</FilterTitle>
                    {LOADERS.map(l => (
                        <FilterItem key={l}>
                            <input
                                type='checkbox'
                                checked={loaders.includes(l)}
                                onChange={() => toggleArr(loaders, setLoaders, l)}
                            />
                            {l}
                        </FilterItem>
                    ))}
                </FilterSection>
            </FilterPanel>
        </Page>
    );
}

/* ─── Plugin card sub-component ──────────────────────────────── */
function PluginCard({ plugin, isInstalled, onInstall }: {
    plugin: Plugin;
    isInstalled: boolean;
    onInstall: (version: string) => void;
}) {
    const [selectedVersion, setSelectedVersion] = useState('latest');

    return (
        <Card>
            <CardTop>
                <PluginIcon>
                    {plugin.icon ? (
                        <img src={plugin.icon} alt={plugin.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                        <IconPlaceholder />
                    )}
                </PluginIcon>
                <CardInfo>
                    <CardName>
                        <a href={plugin.url} target='_blank' rel='noopener noreferrer'>
                            {plugin.name}
                        </a>
                        <a href={plugin.url} target='_blank' rel='noopener noreferrer' style={{ color: '#374151' }}>
                            <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '0.65rem' }} />
                        </a>
                        <SourceBadge src={plugin.source}>{plugin.source}</SourceBadge>
                    </CardName>
                    <CardAuthor>by {plugin.author}</CardAuthor>
                </CardInfo>
            </CardTop>

            <CardDesc>{plugin.description}</CardDesc>

            <CardMeta>
                <MetaItem>
                    <FontAwesomeIcon icon={faDownload} />
                    {fmt(plugin.downloads)}
                </MetaItem>
                <MetaItem>
                    <FontAwesomeIcon icon={faStar} />
                    {fmt(plugin.stars)}
                </MetaItem>
                <MetaItem>
                    {relativeTime(plugin.updated)}
                </MetaItem>
            </CardMeta>

            <CardFooter>
                <VersionSelect
                    value={selectedVersion}
                    onChange={e => setSelectedVersion(e.target.value)}
                >
                    <option value='latest'>Latest version</option>
                    {MC_VERSIONS.map(v => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </VersionSelect>
                <InstallBtn
                    installed={isInstalled}
                    onClick={() => !isInstalled && onInstall(selectedVersion)}
                >
                    {isInstalled ? 'Installed' : 'Select Version'}
                </InstallBtn>
            </CardFooter>
        </Card>
    );
}
