import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import axios from 'axios';
import { ServerContext } from '@/state/server';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import getFileContents from '@/api/server/files/getFileContents';
import renameFiles from '@/api/server/files/renameFiles';
import deleteFiles from '@/api/server/files/deleteFiles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen, faCheckCircle, faExclamationTriangle, faSync,
    faTrashAlt, faToggleOn, faToggleOff, faUpload,
} from '@fortawesome/free-solid-svg-icons';

const fadeUp = keyframes`from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}`;
const rowIn  = keyframes`from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}`;

const Page = styled.div`
    padding:28px;max-width:880px;color:#e8f5e8;font-family:'Inter',sans-serif;
    animation:${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
`;
const Heading = styled.h2`font-size:1.05rem;font-weight:700;color:#fff;margin:0 0 4px;letter-spacing:-0.025em;`;
const Sub = styled.p`font-size:0.775rem;color:#94a3b8;margin:0 0 22px;`;
const Bar = styled.div`display:flex;align-items:center;gap:10px;margin-bottom:18px;`;
const PathInput = styled.input`
    flex:1;background:#0a0f0a;border:1px solid rgba(8,205,0,0.14);border-radius:8px;
    color:#e8f5e8;font-size:0.78rem;font-family:'Inter',sans-serif;
    padding:9px 12px;outline:none;transition:border-color 0.15s;
    &:focus{border-color:rgba(8,205,0,0.35);}
`;
const UploadBtn = styled.label`
    display:flex;align-items:center;gap:6px;padding:9px 16px;
    background:#08cd00;color:#0a0f0a;border-radius:8px;
    font-size:0.78rem;font-weight:700;cursor:pointer;transition:all 0.15s;
    font-family:'Inter',sans-serif;
    &:hover{background:#07b300;transform:translateY(-1px);}
    input{display:none;}
`;
const RefreshBtn = styled.button`
    display:flex;align-items:center;gap:6px;padding:9px 14px;
    background:#0e140e;border:1px solid rgba(8,205,0,0.14);
    color:#e8f5e8;border-radius:8px;font-size:0.78rem;font-weight:600;
    cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.15s;
    &:hover{border-color:rgba(8,205,0,0.35);}
`;
const Card = styled.div`
    background:#0e140e;border:1px solid rgba(8,205,0,0.1);
    border-radius:12px;padding:18px;margin-bottom:12px;
`;
const CardTitle = styled.div`
    font-size:0.72rem;font-weight:700;color:#4d7a4d;
    letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;
`;
const Row = styled.div<{ $delay: number; $enabled?: boolean }>`
    display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:10px;
    margin-bottom:8px;
    background:${p => p.$enabled ? 'rgba(8,205,0,0.04)' : 'rgba(100,116,139,0.04)'};
    border:1px solid ${p => p.$enabled ? 'rgba(8,205,0,0.18)' : 'rgba(100,116,139,0.14)'};
    transition:all 0.18s;
    animation:${rowIn} 0.3s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay:${p => p.$delay}ms;
`;
const Icon = styled.div<{ $enabled?: boolean }>`
    width:38px;height:38px;border-radius:9px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    background:${p => p.$enabled ? 'rgba(8,205,0,0.12)' : 'rgba(100,116,139,0.12)'};
    color:${p => p.$enabled ? '#08cd00' : '#64748b'};
`;
const Name = styled.div<{ $enabled?: boolean }>`
    font-size:0.85rem;font-weight:600;
    color:${p => p.$enabled ? '#fff' : '#94a3b8'};
`;
const Meta = styled.div`font-size:0.68rem;color:#64748b;margin-top:2px;`;
const StateTag = styled.span<{ $enabled?: boolean }>`
    font-size:0.6rem;font-weight:700;padding:2px 7px;border-radius:5px;
    margin-left:8px;letter-spacing:0.05em;
    background:${p => p.$enabled ? 'rgba(8,205,0,0.15)' : 'rgba(100,116,139,0.15)'};
    color:${p => p.$enabled ? '#08cd00' : '#94a3b8'};
`;
const Actions = styled.div`display:flex;gap:6px;margin-left:auto;`;
const IconBtn = styled.button<{ $danger?: boolean }>`
    width:32px;height:32px;border-radius:7px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;font-size:0.78rem;
    transition:all 0.15s;
    ${p => p.$danger
        ? 'background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);color:#ef4444;&:hover{background:rgba(239,68,68,0.16);}'
        : 'background:rgba(8,205,0,0.06);border:1px solid rgba(8,205,0,0.18);color:#08cd00;&:hover{background:rgba(8,205,0,0.14);}'
    }
`;
const Empty = styled.div`text-align:center;padding:30px;color:#3d5c3d;font-size:0.82rem;`;
const Toast = styled.div<{ $ok?: boolean }>`
    display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;
    font-size:0.775rem;font-weight:500;margin-bottom:16px;
    ${p => p.$ok
        ? 'background:rgba(8,205,0,0.09);border:1px solid rgba(8,205,0,0.25);color:#08cd00;'
        : 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;'
    }
`;
const Hint = styled.div`
    font-size:0.72rem;color:#94a3b8;margin-bottom:14px;line-height:1.5;
    background:rgba(8,205,0,0.04);border:1px solid rgba(8,205,0,0.1);
    border-radius:8px;padding:10px 12px;
`;

const DISABLED_PREFIX = 'disabled_';

interface Pack {
    file: FileObject;
    enabled: boolean;
    baseName: string;
}

function readPackName(f: FileObject): { baseName: string; enabled: boolean } {
    const enabled = !f.name.startsWith(DISABLED_PREFIX);
    const baseName = enabled ? f.name : f.name.slice(DISABLED_PREFIX.length);
    return { baseName, enabled };
}

export default function DataPackManagerContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const [world, setWorld] = useState('world');
    const [packs, setPacks] = useState<Pack[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const dir = `/${world}/datapacks`;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const props = await getFileContents(uuid, '/server.properties').catch(() => '');
            const m = props.match(/^\s*level-name\s*=\s*(.+?)\s*$/m);
            const w = m ? m[1].trim() : 'world';
            setWorld(w);
            const files = await loadDirectory(uuid, `/${w}/datapacks`);
            const visible = files.filter(f => f.name !== '.' && f.name !== '..');
            setPacks(visible.map(f => {
                const { baseName, enabled } = readPackName(f);
                return { file: f, baseName, enabled };
            }));
        } catch {
            setPacks([]);
        } finally { setLoading(false); }
    }, [uuid]);

    useEffect(() => { load(); }, [load]);

    const toggle = async (pack: Pack) => {
        setBusy(pack.file.name);
        try {
            const to = pack.enabled ? `${DISABLED_PREFIX}${pack.file.name}` : pack.file.name.slice(DISABLED_PREFIX.length);
            await renameFiles(uuid, dir, [{ from: pack.file.name, to }]);
            setToast({ msg: `${pack.baseName} ${pack.enabled ? 'disabled' : 'enabled'}.`, ok: true });
            await load();
        } catch { setToast({ msg: 'Failed to toggle datapack.', ok: false }); }
        finally { setBusy(null); }
    };

    const remove = async (pack: Pack) => {
        setBusy(pack.file.name);
        try {
            await deleteFiles(uuid, dir, [pack.file.name]);
            setPacks(p => p.filter(x => x.file.name !== pack.file.name));
            setToast({ msg: `${pack.baseName} removed.`, ok: true });
        } catch { setToast({ msg: 'Failed to delete datapack.', ok: false }); }
        finally { setBusy(null); }
    };

    const upload = async (file: File) => {
        setBusy(file.name);
        try {
            const url = await getFileUploadUrl(uuid);
            const form = new FormData();
            form.append('files', file, file.name);
            await axios.post(`${url}&directory=${encodeURIComponent(dir)}`, form);
            setToast({ msg: `Uploaded ${file.name}.`, ok: true });
            await load();
        } catch { setToast({ msg: 'Upload failed.', ok: false }); }
        finally { setBusy(null); if (fileRef.current) fileRef.current.value = ''; }
    };

    return (
        <Page>
            <Heading>DataPack Manager</Heading>
            <Sub>Install, enable, or remove datapacks for <code style={{ color: '#7aab78' }}>{dir}</code>.</Sub>

            {toast && <Toast $ok={toast.ok}><FontAwesomeIcon icon={toast.ok ? faCheckCircle : faExclamationTriangle}/> {toast.msg}</Toast>}

            <Hint>
                Datapacks are toggled by renaming with a <code style={{ color: '#7aab78' }}>{DISABLED_PREFIX}</code> prefix.
                Restart the world or run <code style={{ color: '#7aab78' }}>/reload</code> in-game to apply changes.
            </Hint>

            <Bar>
                <PathInput value={dir} readOnly/>
                <RefreshBtn onClick={load}><FontAwesomeIcon icon={faSync}/> Refresh</RefreshBtn>
                <UploadBtn>
                    <FontAwesomeIcon icon={faUpload}/> Upload
                    <input ref={fileRef} type='file' accept='.zip' onChange={e => {
                        const f = e.target.files?.[0]; if (f) upload(f);
                    }}/>
                </UploadBtn>
            </Bar>

            <Card>
                <CardTitle>Installed</CardTitle>
                {loading ? (
                    <Empty>Loading datapacks…</Empty>
                ) : packs.length === 0 ? (
                    <Empty>No datapacks installed in this world.</Empty>
                ) : packs.map((p, i) => (
                    <Row key={p.file.name} $delay={i * 40} $enabled={p.enabled}>
                        <Icon $enabled={p.enabled}><FontAwesomeIcon icon={faBoxOpen}/></Icon>
                        <div>
                            <Name $enabled={p.enabled}>
                                {p.baseName}
                                <StateTag $enabled={p.enabled}>{p.enabled ? 'ENABLED' : 'DISABLED'}</StateTag>
                            </Name>
                            <Meta>{(p.file.size / 1024).toFixed(1)} KB · {p.file.modifiedAt.toLocaleDateString()}</Meta>
                        </div>
                        <Actions>
                            <IconBtn title={p.enabled ? 'Disable' : 'Enable'} disabled={busy === p.file.name} onClick={() => toggle(p)}>
                                <FontAwesomeIcon icon={p.enabled ? faToggleOn : faToggleOff}/>
                            </IconBtn>
                            <IconBtn $danger title='Delete' disabled={busy === p.file.name} onClick={() => remove(p)}>
                                <FontAwesomeIcon icon={faTrashAlt}/>
                            </IconBtn>
                        </Actions>
                    </Row>
                ))}
            </Card>
        </Page>
    );
}
