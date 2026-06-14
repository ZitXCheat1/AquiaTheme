import React, { useCallback, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import compressFiles from '@/api/server/files/compressFiles';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import deleteFiles from '@/api/server/files/deleteFiles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGlobeAmericas, faCheckCircle, faExclamationTriangle, faDownload,
    faTrashAlt, faSync, faStar,
} from '@fortawesome/free-solid-svg-icons';

const fadeUp = keyframes`from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}`;
const rowIn = keyframes`from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}`;

const Page = styled.div`
    padding: 28px; max-width: 880px; color: #e8f5e8;
    font-family: 'Inter', sans-serif;
    animation: ${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
`;
const Heading = styled.h2`font-size:1.05rem;font-weight:700;color:#fff;margin:0 0 4px;letter-spacing:-0.025em;`;
const Sub = styled.p`font-size:0.775rem;color:#94a3b8;margin:0 0 22px;`;
const Card = styled.div`
    background:#0e140e;border:1px solid rgba(8,205,0,0.1);
    border-radius:12px;padding:18px;margin-bottom:12px;
`;
const CardTitle = styled.div`
    font-size:0.72rem;font-weight:700;color:#4d7a4d;
    letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;
    display:flex;align-items:center;gap:8px;
`;
const Row = styled.div<{ $delay: number; $active?: boolean }>`
    display:flex;align-items:center;gap:14px;
    padding:12px 14px;border-radius:10px;margin-bottom:8px;
    background:${p => p.$active ? 'rgba(8,205,0,0.08)' : 'rgba(8,205,0,0.03)'};
    border:1px solid ${p => p.$active ? 'rgba(8,205,0,0.35)' : 'rgba(8,205,0,0.09)'};
    transition:all 0.18s;
    animation:${rowIn} 0.3s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay:${p => p.$delay}ms;
    &:hover{border-color:rgba(8,205,0,0.25);}
`;
const WIcon = styled.div<{ $active?: boolean }>`
    width:38px;height:38px;border-radius:9px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    background:${p => p.$active ? 'rgba(8,205,0,0.18)' : '#162016'};
    color:${p => p.$active ? '#08cd00' : '#4d7a4d'};font-size:0.95rem;
`;
const WName = styled.div`font-size:0.85rem;font-weight:600;color:#fff;`;
const WMeta = styled.div`font-size:0.68rem;color:#64748b;margin-top:2px;`;
const ActiveTag = styled.span`
    background:rgba(8,205,0,0.15);color:#08cd00;font-size:0.6rem;font-weight:700;
    padding:2px 7px;border-radius:5px;margin-left:8px;letter-spacing:0.05em;
`;
const Actions = styled.div`display:flex;gap:6px;margin-left:auto;`;
const IconBtn = styled.button<{ $danger?: boolean }>`
    width:32px;height:32px;border-radius:7px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;font-size:0.72rem;
    transition:all 0.15s;
    ${p => p.$danger
        ? 'background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);color:#ef4444;&:hover{background:rgba(239,68,68,0.16);}'
        : 'background:rgba(8,205,0,0.06);border:1px solid rgba(8,205,0,0.18);color:#08cd00;&:hover{background:rgba(8,205,0,0.14);}'
    }
`;
const RefreshBtn = styled.button`
    background:none;border:none;color:#4d7a4d;cursor:pointer;font-size:0.72rem;
    margin-left:auto;display:flex;align-items:center;gap:6px;transition:color 0.15s;
    &:hover{color:#08cd00;}
`;
const Empty = styled.div`text-align:center;padding:30px;color:#3d5c3d;font-size:0.82rem;`;
const Toast = styled.div<{ $ok?: boolean }>`
    display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;
    font-size:0.775rem;font-weight:500;margin-bottom:16px;
    animation:${fadeUp} 0.3s ease both;
    ${p => p.$ok
        ? 'background:rgba(8,205,0,0.09);border:1px solid rgba(8,205,0,0.25);color:#08cd00;'
        : 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;'
    }
`;
const Confirm = styled.div`
    position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:60;
    display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);
`;
const Dialog = styled.div`
    background:#0e140e;border:1px solid rgba(8,205,0,0.18);border-radius:12px;
    padding:22px;max-width:380px;width:90%;
`;
const DBtn = styled.button<{ $primary?: boolean }>`
    padding:8px 16px;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;
    border:none;transition:all 0.15s;font-family:'Inter',sans-serif;
    ${p => p.$primary
        ? 'background:#ef4444;color:#fff;&:hover{background:#dc2626;}'
        : 'background:transparent;color:#94a3b8;border:1px solid rgba(255,255,255,0.1);&:hover{background:rgba(255,255,255,0.04);}'
    }
`;

const WORLD_HINTS = ['world', 'level', 'dim', 'nether', 'end'];

function isWorldDir(f: FileObject): boolean {
    if (f.isFile) return false;
    const lower = f.name.toLowerCase();
    return WORLD_HINTS.some(h => lower.includes(h));
}

function parseLevelName(props: string): string {
    const m = props.match(/^\s*level-name\s*=\s*(.+?)\s*$/m);
    return m ? m[1].trim() : 'world';
}

function setLevelName(props: string, name: string): string {
    if (props.match(/^\s*level-name\s*=/m)) {
        return props.replace(/^\s*level-name\s*=.*$/m, `level-name=${name}`);
    }
    return props + (props.endsWith('\n') ? '' : '\n') + `level-name=${name}\n`;
}

export default function WorldManagerContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const [worlds, setWorlds] = useState<FileObject[]>([]);
    const [active, setActive] = useState('world');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [confirm, setConfirm] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [files, props] = await Promise.all([
                loadDirectory(uuid, '/'),
                getFileContents(uuid, '/server.properties').catch(() => ''),
            ]);
            setWorlds(files.filter(isWorldDir));
            setActive(parseLevelName(props));
        } catch {
            setWorlds([]);
        } finally { setLoading(false); }
    }, [uuid]);

    useEffect(() => { load(); }, [load]);

    const activate = async (name: string) => {
        setBusy(name);
        try {
            const props = await getFileContents(uuid, '/server.properties');
            await saveFileContents(uuid, '/server.properties', setLevelName(props, name));
            setActive(name);
            setToast({ msg: `Active world set to "${name}". Restart server to apply.`, ok: true });
        } catch { setToast({ msg: 'Failed to update server.properties.', ok: false }); }
        finally { setBusy(null); }
    };

    const download = async (name: string) => {
        setBusy(name);
        try {
            const archive = await compressFiles(uuid, '/', [name]);
            const url = await getFileDownloadUrl(uuid, `/${archive.name}`);
            window.location.href = url;
            setToast({ msg: `Download started for "${name}".`, ok: true });
        } catch { setToast({ msg: 'Failed to compress world.', ok: false }); }
        finally { setBusy(null); }
    };

    const destroy = async (name: string) => {
        setBusy(name); setConfirm(null);
        try {
            await deleteFiles(uuid, '/', [name]);
            setWorlds(w => w.filter(f => f.name !== name));
            setToast({ msg: `World "${name}" deleted. It will regenerate on next start.`, ok: true });
        } catch { setToast({ msg: 'Failed to delete world.', ok: false }); }
        finally { setBusy(null); }
    };

    return (
        <Page>
            <Heading>World Manager</Heading>
            <Sub>Switch between worlds, download a snapshot, or regenerate a world from scratch.</Sub>

            {toast && <Toast $ok={toast.ok}><FontAwesomeIcon icon={toast.ok ? faCheckCircle : faExclamationTriangle}/> {toast.msg}</Toast>}

            <Card>
                <CardTitle>
                    <FontAwesomeIcon icon={faGlobeAmericas}/> Worlds
                    <RefreshBtn onClick={load}><FontAwesomeIcon icon={faSync}/> Refresh</RefreshBtn>
                </CardTitle>

                {loading ? (
                    <Empty>Loading worlds…</Empty>
                ) : worlds.length === 0 ? (
                    <Empty>No world folders found in the server root.</Empty>
                ) : worlds.map((w, i) => (
                    <Row key={w.name} $delay={i * 40} $active={w.name === active}>
                        <WIcon $active={w.name === active}><FontAwesomeIcon icon={faGlobeAmericas}/></WIcon>
                        <div>
                            <WName>
                                {w.name}
                                {w.name === active && <ActiveTag>ACTIVE</ActiveTag>}
                            </WName>
                            <WMeta>Modified {w.modifiedAt.toLocaleDateString()}</WMeta>
                        </div>
                        <Actions>
                            {w.name !== active && (
                                <IconBtn title='Set as active' disabled={!!busy} onClick={() => activate(w.name)}>
                                    <FontAwesomeIcon icon={faStar}/>
                                </IconBtn>
                            )}
                            <IconBtn title='Download as zip' disabled={!!busy} onClick={() => download(w.name)}>
                                <FontAwesomeIcon icon={faDownload}/>
                            </IconBtn>
                            <IconBtn $danger title='Delete (regenerate on next start)' disabled={!!busy} onClick={() => setConfirm(w.name)}>
                                <FontAwesomeIcon icon={faTrashAlt}/>
                            </IconBtn>
                        </Actions>
                    </Row>
                ))}
            </Card>

            {confirm && (
                <Confirm onClick={() => setConfirm(null)}>
                    <Dialog onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>Delete "{confirm}"?</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 18 }}>
                            This permanently removes the folder. If it's the active world, Minecraft will generate a fresh one on next start.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <DBtn onClick={() => setConfirm(null)}>Cancel</DBtn>
                            <DBtn $primary onClick={() => destroy(confirm)}>Delete</DBtn>
                        </div>
                    </Dialog>
                </Confirm>
            )}
        </Page>
    );
}
