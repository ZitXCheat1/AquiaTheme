import React, { useCallback, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import getFileContents from '@/api/server/files/getFileContents';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import deleteFiles from '@/api/server/files/deleteFiles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSkullCrossbones, faDownload, faTrashAlt, faSync,
    faChevronDown, faChevronRight, faCheckCircle, faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

const fadeUp = keyframes`from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}`;
const rowIn  = keyframes`from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}`;

const Page = styled.div`
    padding:28px;max-width:920px;color:#e8f5e8;font-family:'Inter',sans-serif;
    animation:${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
`;
const Heading = styled.h2`font-size:1.05rem;font-weight:700;color:#fff;margin:0 0 4px;letter-spacing:-0.025em;`;
const Sub = styled.p`font-size:0.775rem;color:#94a3b8;margin:0 0 22px;`;
const Card = styled.div`
    background:#0e140e;border:1px solid rgba(8,205,0,0.1);
    border-radius:12px;padding:18px;margin-bottom:12px;
`;
const HeadRow = styled.div`
    display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;
`;
const CardTitle = styled.div`
    font-size:0.72rem;font-weight:700;color:#4d7a4d;
    letter-spacing:0.08em;text-transform:uppercase;
    display:flex;align-items:center;gap:8px;
`;
const RefreshBtn = styled.button`
    background:none;border:none;color:#4d7a4d;cursor:pointer;font-size:0.72rem;
    display:flex;align-items:center;gap:6px;transition:color 0.15s;
    &:hover{color:#08cd00;}
`;
const Crash = styled.div<{ $delay: number }>`
    border:1px solid rgba(239,68,68,0.14);background:rgba(239,68,68,0.03);
    border-radius:10px;margin-bottom:8px;overflow:hidden;
    animation:${rowIn} 0.3s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay:${p => p.$delay}ms;
`;
const Head = styled.div`
    display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;
    transition:background 0.15s;
    &:hover{background:rgba(239,68,68,0.06);}
`;
const Skull = styled.div`
    width:34px;height:34px;border-radius:8px;flex-shrink:0;
    background:rgba(239,68,68,0.12);color:#ef4444;
    display:flex;align-items:center;justify-content:center;font-size:0.9rem;
`;
const Info = styled.div`flex:1;min-width:0;`;
const Name = styled.div`font-size:0.82rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const Meta = styled.div`font-size:0.68rem;color:#94a3b8;margin-top:2px;`;
const Actions = styled.div`display:flex;gap:6px;flex-shrink:0;`;
const IconBtn = styled.button<{ $danger?: boolean }>`
    width:30px;height:30px;border-radius:7px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;font-size:0.7rem;
    transition:all 0.15s;
    ${p => p.$danger
        ? 'background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);color:#ef4444;&:hover{background:rgba(239,68,68,0.16);}'
        : 'background:rgba(8,205,0,0.06);border:1px solid rgba(8,205,0,0.18);color:#08cd00;&:hover{background:rgba(8,205,0,0.14);}'
    }
`;
const Body = styled.div`
    padding:14px 18px;background:#0a0f0a;border-top:1px solid rgba(239,68,68,0.1);
`;
const FieldLabel = styled.div`
    font-size:0.62rem;font-weight:700;color:#7aab78;letter-spacing:0.08em;
    text-transform:uppercase;margin:8px 0 4px;
    &:first-child{margin-top:0;}
`;
const FieldVal = styled.pre`
    margin:0;font-family:'JetBrains Mono','Fira Code',monospace;
    font-size:0.74rem;color:#e8f5e8;background:#0e140e;
    border:1px solid rgba(8,205,0,0.08);border-radius:6px;
    padding:8px 10px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;
`;
const Empty = styled.div`text-align:center;padding:36px;color:#3d5c3d;font-size:0.82rem;`;
const Toast = styled.div<{ $ok?: boolean }>`
    display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;
    font-size:0.775rem;font-weight:500;margin-bottom:16px;
    ${p => p.$ok
        ? 'background:rgba(8,205,0,0.09);border:1px solid rgba(8,205,0,0.25);color:#08cd00;'
        : 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;'
    }
`;

interface Parsed {
    description?: string;
    exception?: string;
    minecraft?: string;
    java?: string;
    os?: string;
    stack?: string;
}

function parseCrash(raw: string): Parsed {
    const out: Parsed = {};
    const desc = raw.match(/Description:\s*(.+)/);
    if (desc) out.description = desc[1].trim();
    const stackStart = raw.indexOf('-- Head --');
    const stackEnd = raw.indexOf('-- ', stackStart + 10);
    if (stackStart !== -1) {
        out.stack = raw.slice(stackStart, stackEnd === -1 ? stackStart + 1400 : stackEnd).slice(0, 1400);
    } else {
        const ex = raw.match(/(\b[\w.$]+(?:Exception|Error)[:\s].*?)(?:\n\n|\n\tat)/s);
        if (ex) out.stack = ex[1].slice(0, 800);
    }
    const exMatch = raw.match(/\b([\w.$]+(?:Exception|Error))(?::\s*([^\n]+))?/);
    if (exMatch) out.exception = exMatch[2] ? `${exMatch[1]}: ${exMatch[2]}` : exMatch[1];
    const mc = raw.match(/Minecraft Version:\s*(.+)/);
    if (mc) out.minecraft = mc[1].trim();
    const java = raw.match(/Java Version:\s*(.+)/);
    if (java) out.java = java[1].trim();
    const os = raw.match(/Operating System:\s*(.+)/);
    if (os) out.os = os[1].trim();
    return out;
}

interface CrashItem {
    file: FileObject;
    parsed?: Parsed;
    loaded: boolean;
}

export default function CrashReportsContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const [items, setItems] = useState<CrashItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const files = await loadDirectory(uuid, '/crash-reports');
            const sorted = files
                .filter(f => f.isFile && f.name.endsWith('.txt'))
                .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
            setItems(sorted.map(f => ({ file: f, loaded: false })));
        } catch {
            setItems([]);
        } finally { setLoading(false); }
    }, [uuid]);

    useEffect(() => { load(); }, [load]);

    const expand = async (name: string) => {
        if (expanded === name) { setExpanded(null); return; }
        setExpanded(name);
        const target = items.find(i => i.file.name === name);
        if (!target || target.loaded) return;
        try {
            const raw = await getFileContents(uuid, `/crash-reports/${name}`);
            setItems(prev => prev.map(i =>
                i.file.name === name ? { ...i, parsed: parseCrash(raw), loaded: true } : i
            ));
        } catch {
            setItems(prev => prev.map(i =>
                i.file.name === name ? { ...i, parsed: { description: 'Failed to read crash report.' }, loaded: true } : i
            ));
        }
    };

    const download = async (name: string) => {
        try {
            const url = await getFileDownloadUrl(uuid, `/crash-reports/${name}`);
            window.location.href = url;
        } catch { setToast({ msg: 'Failed to download report.', ok: false }); }
    };

    const remove = async (name: string) => {
        try {
            await deleteFiles(uuid, '/crash-reports', [name]);
            setItems(prev => prev.filter(i => i.file.name !== name));
            setToast({ msg: `Removed ${name}.`, ok: true });
        } catch { setToast({ msg: 'Failed to delete report.', ok: false }); }
    };

    return (
        <Page>
            <Heading>Crash Reports</Heading>
            <Sub>Automatically collected from <code style={{ color: '#7aab78' }}>/crash-reports</code>. Newest first.</Sub>

            {toast && <Toast $ok={toast.ok}><FontAwesomeIcon icon={toast.ok ? faCheckCircle : faExclamationTriangle}/> {toast.msg}</Toast>}

            <Card>
                <HeadRow>
                    <CardTitle><FontAwesomeIcon icon={faSkullCrossbones}/> Reports</CardTitle>
                    <RefreshBtn onClick={load}><FontAwesomeIcon icon={faSync}/> Refresh</RefreshBtn>
                </HeadRow>

                {loading ? (
                    <Empty>Scanning crash reports…</Empty>
                ) : items.length === 0 ? (
                    <Empty>No crash reports — your server has been healthy.</Empty>
                ) : items.map((item, i) => {
                    const open = expanded === item.file.name;
                    return (
                        <Crash key={item.file.name} $delay={i * 40}>
                            <Head onClick={() => expand(item.file.name)}>
                                <Skull><FontAwesomeIcon icon={faSkullCrossbones}/></Skull>
                                <Info>
                                    <Name>{item.file.name}</Name>
                                    <Meta>{item.file.modifiedAt.toLocaleString()} · {(item.file.size / 1024).toFixed(1)} KB</Meta>
                                </Info>
                                <Actions onClick={e => e.stopPropagation()}>
                                    <IconBtn title='Download' onClick={() => download(item.file.name)}>
                                        <FontAwesomeIcon icon={faDownload}/>
                                    </IconBtn>
                                    <IconBtn $danger title='Delete' onClick={() => remove(item.file.name)}>
                                        <FontAwesomeIcon icon={faTrashAlt}/>
                                    </IconBtn>
                                    <IconBtn title={open ? 'Collapse' : 'Expand'}>
                                        <FontAwesomeIcon icon={open ? faChevronDown : faChevronRight}/>
                                    </IconBtn>
                                </Actions>
                            </Head>
                            {open && (
                                <Body>
                                    {!item.loaded ? (
                                        <FieldVal>Loading…</FieldVal>
                                    ) : (
                                        <>
                                            {item.parsed?.description && (<><FieldLabel>Description</FieldLabel><FieldVal>{item.parsed.description}</FieldVal></>)}
                                            {item.parsed?.exception && (<><FieldLabel>Exception</FieldLabel><FieldVal>{item.parsed.exception}</FieldVal></>)}
                                            {item.parsed?.minecraft && (<><FieldLabel>Minecraft Version</FieldLabel><FieldVal>{item.parsed.minecraft}</FieldVal></>)}
                                            {item.parsed?.java && (<><FieldLabel>Java</FieldLabel><FieldVal>{item.parsed.java}</FieldVal></>)}
                                            {item.parsed?.os && (<><FieldLabel>Operating System</FieldLabel><FieldVal>{item.parsed.os}</FieldVal></>)}
                                            {item.parsed?.stack && (<><FieldLabel>Stack trace (head)</FieldLabel><FieldVal>{item.parsed.stack}</FieldVal></>)}
                                            {!item.parsed?.description && !item.parsed?.exception && !item.parsed?.stack && (
                                                <FieldVal>Could not parse this report. Use Download to view it in full.</FieldVal>
                                            )}
                                        </>
                                    )}
                                </Body>
                            )}
                        </Crash>
                    );
                })}
            </Card>
        </Page>
    );
}
