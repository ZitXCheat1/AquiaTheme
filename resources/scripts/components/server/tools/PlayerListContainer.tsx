import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components/macro';
import { keyframes } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserShield, faUserSlash, faList, faPlus, faTimes,
    faCheckCircle, faExclamationTriangle, faSearch, faSync,
} from '@fortawesome/free-solid-svg-icons';

type ListType = 'whitelist' | 'ops' | 'banned';

interface PlayerEntry {
    uuid?: string; name: string; level?: number;
    created?: string; source?: string; expires?: string; reason?: string;
}

const fadeUp = keyframes`from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}`;
const rowIn  = keyframes`from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}`;

const Page = styled.div`
    padding: 28px; max-width: 820px; font-family: 'Inter', sans-serif;
    animation: ${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both; color: #ffffff;
`;
const TabStrip = styled.div`display: flex; gap: 2px; margin-bottom: 20px; border-bottom: 1px solid rgba(8,205,0,0.1);`;
const Tab = styled.button<{ $active?: boolean }>`
    display: flex; align-items: center; gap: 7px; padding: 9px 16px;
    background: transparent; border: none; font-family: 'Inter', sans-serif;
    font-size: 0.8rem; font-weight: ${p => p.$active ? 700 : 500};
    color: ${p => p.$active ? '#ffffff' : '#64748b'};
    border-bottom: 2px solid ${p => p.$active ? '#08cd00' : 'transparent'};
    margin-bottom: -1px; cursor: pointer; transition: all 0.15s;
    &:hover { color: #94a3b8; }
`;
const Card = styled.div`
    background: #0e140e; border: 1px solid rgba(8,205,0,0.1);
    border-radius: 12px; padding: 18px; margin-bottom: 12px;
`;
const CardTitle = styled.div`
    font-size: 0.72rem; font-weight: 700; color: #4d7a4d;
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;
`;
const AddRow = styled.div`display: flex; gap: 8px;`;
const Input = styled.input`
    flex: 1; background: #0a0f0a; border: 1px solid rgba(8,205,0,0.14); border-radius: 8px;
    color: #ffffff; font-size: 0.82rem; padding: 9px 12px; outline: none;
    font-family: 'Inter', sans-serif; transition: border-color 0.15s;
    &:focus { border-color: rgba(8,205,0,0.35); }
    &::placeholder { color: #2a3d2a; }
`;
const AddBtn = styled.button`
    display: flex; align-items: center; gap: 6px; padding: 9px 16px;
    background: #08cd00; border: none; border-radius: 8px; color: #0a0f0a;
    font-size: 0.8rem; font-weight: 700; font-family: 'Inter', sans-serif;
    cursor: pointer; white-space: nowrap; transition: all 0.15s;
    &:hover:not(:disabled) { background: #07b300; transform: translateY(-1px); }
    &:disabled { opacity: 0.4; cursor: default; }
`;
const SearchWrap = styled.div`position: relative; margin-bottom: 10px;`;
const SIcon = styled.div`position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#3d5c3d;font-size:0.75rem;pointer-events:none;`;
const SearchInput = styled(Input)`padding-left: 32px; flex: none; width: 100%;`;
const PlayerGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
    margin-top: 4px;
`;
const PlayerRow = styled.div<{ $delay: number }>`
    display: flex; flex-direction: column; align-items: center; gap: 0;
    padding: 16px 12px 12px;
    background: rgba(8,205,0,0.03); border: 1px solid rgba(8,205,0,0.09);
    border-radius: 12px; transition: all 0.18s; position: relative;
    animation: ${rowIn} 0.3s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay: ${p => p.$delay}ms;
    &:hover { border-color: rgba(8,205,0,0.25); background: rgba(8,205,0,0.06); transform: translateY(-2px); }
`;
const AvatarWrap = styled.div`
    width: 64px; height: 64px; border-radius: 10px;
    background: #162016; border: 2px solid rgba(8,205,0,0.15);
    overflow: hidden; margin-bottom: 10px; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
`;
const Avatar = styled.img`width:64px;height:64px;image-rendering:pixelated;display:block;`;
const Info = styled.div`flex:1;min-width:0;text-align:center;width:100%;`;
const PName = styled.div`font-size:0.82rem;font-weight:600;color:#ffffff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const PMeta = styled.div`font-size:0.65rem;color:#64748b;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const RemBtn = styled.button`
    width:30px;height:30px;border-radius:7px;background:rgba(239,68,68,0.07);
    border:1px solid rgba(239,68,68,0.18);color:#ef4444;cursor:pointer;
    display:flex;align-items:center;justify-content:center;font-size:0.7rem;
    transition:all 0.15s;flex-shrink:0;
    &:hover{background:rgba(239,68,68,0.16);}
`;
const OpBadge = styled.div`
    background:rgba(234,179,8,0.12);border:1px solid rgba(234,179,8,0.25);
    color:#eab308;font-size:0.65rem;font-weight:700;padding:2px 7px;border-radius:5px;
`;
const BanBadge = styled.div`
    background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.22);
    color:#ef4444;font-size:0.65rem;font-weight:700;padding:2px 7px;border-radius:5px;white-space:nowrap;
`;
const Empty = styled.div`text-align:center;padding:28px;color:#3d5c3d;font-size:0.82rem;`;
const Toast = styled.div<{ $ok?: boolean }>`
    display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;
    font-size:0.775rem;font-weight:500;margin-bottom:16px;
    animation:${fadeUp} 0.3s ease both;
    ${p => p.$ok
        ? 'background:rgba(8,205,0,0.09);border:1px solid rgba(8,205,0,0.25);color:#08cd00;'
        : 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;'
    }
`;

function parseList(raw: string): PlayerEntry[] {
    try {
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr.map((e: any) => ({
            uuid: e.uuid, name: e.name || 'Unknown', level: e.level,
            created: e.created, source: e.source, expires: e.expires, reason: e.reason,
        }));
    } catch {
        return raw.split('\n').filter(l => l.trim()).map(name => ({ name: name.trim() }));
    }
}

function serialize(entries: PlayerEntry[], type: ListType): string {
    const arr = entries.map(e => {
        const base = { uuid: e.uuid || '00000000-0000-0000-0000-000000000000', name: e.name };
        if (type === 'ops') return { ...base, level: e.level ?? 4, bypassesPlayerLimit: false };
        if (type === 'banned') return { ...base, created: e.created || new Date().toISOString(), source: e.source || 'Server', expires: e.expires || 'forever', reason: e.reason || 'Banned by operator' };
        return base;
    });
    return JSON.stringify(arr, null, 2);
}

function filePath(type: ListType) {
    return type === 'whitelist' ? '/whitelist.json' : type === 'ops' ? '/ops.json' : '/banned-players.json';
}

const TABS: { id: ListType; label: string; icon: any }[] = [
    { id: 'whitelist', label: 'Whitelist', icon: faList },
    { id: 'ops', label: 'Operators', icon: faUserShield },
    { id: 'banned', label: 'Banned', icon: faUserSlash },
];

export default function PlayerListContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const [tab, setTab] = useState<ListType>('whitelist');
    const [entries, setEntries] = useState<PlayerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const load = useCallback(() => {
        setLoading(true); setEntries([]); setSearch('');
        getFileContents(uuid, filePath(tab))
            .then(raw => setEntries(parseList(raw)))
            .catch(() => setEntries([]))
            .finally(() => setLoading(false));
    }, [uuid, tab]);

    useEffect(() => { load(); }, [load]);

    const add = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const entry: PlayerEntry = { name: newName.trim(), uuid: '00000000-0000-0000-0000-000000000000', level: 4, created: new Date().toISOString(), source: 'AquiaTheme', expires: 'forever', reason: 'Added via panel' };
            const updated = [...entries, entry];
            await saveFileContents(uuid, filePath(tab), serialize(updated, tab));
            setEntries(updated); setNewName('');
            setToast({ msg: `${entry.name} added.`, ok: true });
        } catch { setToast({ msg: 'Failed to save.', ok: false }); }
        finally { setSaving(false); }
    };

    const remove = async (name: string) => {
        const updated = entries.filter(e => e.name !== name);
        try {
            await saveFileContents(uuid, filePath(tab), serialize(updated, tab));
            setEntries(updated);
            setToast({ msg: `${name} removed.`, ok: true });
        } catch { setToast({ msg: 'Failed to save.', ok: false }); }
    };

    const filtered = entries.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <Page>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: 4, letterSpacing: '-0.025em' }}>Player Manager</div>
            <div style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: 20 }}>Manage whitelist, operators, and bans. Restart server to apply changes.</div>

            <TabStrip>
                {TABS.map(t => (
                    <Tab key={t.id} $active={tab === t.id} onClick={() => setTab(t.id)}>
                        <FontAwesomeIcon icon={t.icon}/>{t.label}
                    </Tab>
                ))}
            </TabStrip>

            {toast && (
                <Toast $ok={toast.ok}>
                    <FontAwesomeIcon icon={toast.ok ? faCheckCircle : faExclamationTriangle}/> {toast.msg}
                </Toast>
            )}

            {tab !== 'banned' && (
                <Card>
                    <CardTitle>Add {tab === 'ops' ? 'Operator' : 'Player'}</CardTitle>
                    <AddRow>
                        <Input placeholder='Player username...' value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}/>
                        <AddBtn onClick={add} disabled={saving || !newName.trim()}>
                            <FontAwesomeIcon icon={faPlus}/> Add
                        </AddBtn>
                    </AddRow>
                </Card>
            )}

            <Card>
                <CardTitle>{filtered.length} {tab === 'whitelist' ? 'whitelisted' : tab === 'ops' ? 'operators' : 'banned'}</CardTitle>
                <SearchWrap>
                    <SIcon><FontAwesomeIcon icon={faSearch}/></SIcon>
                    <SearchInput placeholder='Search players...' value={search} onChange={e => setSearch(e.target.value)}/>
                </SearchWrap>
                {loading
                    ? <Empty><FontAwesomeIcon icon={faSync} spin/> Loading...</Empty>
                    : filtered.length === 0
                        ? <Empty>No players found.</Empty>
                        : <PlayerGrid>
                            {filtered.map((p, i) => (
                                <PlayerRow key={p.name} $delay={Math.min(i * 30, 300)}>
                                    <RemBtn onClick={() => remove(p.name)} title={tab === 'banned' ? 'Unban' : 'Remove'}
                                        style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, fontSize: '0.6rem' }}>
                                        <FontAwesomeIcon icon={faTimes}/>
                                    </RemBtn>
                                    <AvatarWrap>
                                        <Avatar
                                            src={'https://mc-heads.net/avatar/' + p.name + '/64'}
                                            alt={p.name}
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://mc-heads.net/avatar/Steve/64'; }}
                                        />
                                    </AvatarWrap>
                                    <Info>
                                        <PName>{p.name}</PName>
                                        <PMeta>{p.reason ? p.reason : p.uuid && p.uuid !== '00000000-0000-0000-0000-000000000000' ? p.uuid : 'No UUID'}</PMeta>
                                    </Info>
                                    {tab === 'ops' && <OpBadge style={{ marginTop: 6 }}>OP {p.level ?? 4}</OpBadge>}
                                    {tab === 'banned' && <BanBadge style={{ marginTop: 6 }}>Banned</BanBadge>}
                                </PlayerRow>
                            ))}
                        </PlayerGrid>
                }
            </Card>
        </Page>
    );
}
