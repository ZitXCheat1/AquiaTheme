import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faSave, faSync, faRandom } from '@fortawesome/free-solid-svg-icons';

/* ─── Minecraft color/format maps ────────────────────────────── */
const MC_COLORS: { code: string; color: string; name: string }[] = [
    { code: '§0', color: '#000000', name: 'Black' },
    { code: '§1', color: '#0000AA', name: 'Dark Blue' },
    { code: '§2', color: '#00AA00', name: 'Dark Green' },
    { code: '§3', color: '#00AAAA', name: 'Dark Aqua' },
    { code: '§4', color: '#AA0000', name: 'Dark Red' },
    { code: '§5', color: '#AA00AA', name: 'Dark Purple' },
    { code: '§6', color: '#FFAA00', name: 'Gold' },
    { code: '§7', color: '#AAAAAA', name: 'Gray' },
    { code: '§8', color: '#555555', name: 'Dark Gray' },
    { code: '§9', color: '#5555FF', name: 'Blue' },
    { code: '§a', color: '#55FF55', name: 'Green' },
    { code: '§b', color: '#55FFFF', name: 'Aqua' },
    { code: '§c', color: '#FF5555', name: 'Red' },
    { code: '§d', color: '#FF55FF', name: 'Light Purple' },
    { code: '§e', color: '#FFFF55', name: 'Yellow' },
    { code: '§f', color: '#FFFFFF', name: 'White' },
];

const MC_FORMATS: { code: string; label: string; css: string }[] = [
    { code: '§l', label: 'B', css: 'font-weight:bold' },
    { code: '§o', label: 'I', css: 'font-style:italic' },
    { code: '§n', label: 'U', css: 'text-decoration:underline' },
    { code: '§m', label: 'S', css: 'text-decoration:line-through' },
    { code: '§r', label: '↺', css: '' },
];

/* ─── MOTD parser → React spans ─────────────────────────────── */
interface Segment { text: string; color?: string; bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; }

function parseMOTD(raw: string): Segment[] {
    const segments: Segment[] = [];
    let color: string | undefined = '#AAAAAA';
    let bold = false, italic = false, underline = false, strike = false;
    let i = 0;
    while (i < raw.length) {
        if (raw[i] === '§' && i + 1 < raw.length) {
            const code = raw[i + 1].toLowerCase();
            const colorEntry = MC_COLORS.find(c => c.code === `§${code}`);
            if (colorEntry) { color = colorEntry.color; bold = false; italic = false; underline = false; strike = false; }
            else if (code === 'l') bold = true;
            else if (code === 'o') italic = true;
            else if (code === 'n') underline = true;
            else if (code === 'm') strike = true;
            else if (code === 'r') { color = '#AAAAAA'; bold = false; italic = false; underline = false; strike = false; }
            i += 2;
        } else if (raw[i] === '\\' && raw[i + 1] === 'n') {
            segments.push({ text: '\n', color });
            i += 2;
        } else {
            let end = i;
            while (end < raw.length && raw[end] !== '§' && !(raw[end] === '\\' && raw[end+1] === 'n')) end++;
            if (end > i) segments.push({ text: raw.slice(i, end), color, bold, italic, underline, strike });
            i = end;
        }
    }
    return segments;
}

/* ─── Keyframes ──────────────────────────────────────────────── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}`;
const blink = keyframes`0%,100%{opacity:1;}50%{opacity:0;}`;
const obfuscate = keyframes`0%,100%{letter-spacing:normal;}50%{letter-spacing:0.15em;}`;

/* ─── Styled ─────────────────────────────────────────────────── */
const Page = styled.div`
    padding: 28px;
    max-width: 780px;
    font-family: 'Inter', sans-serif;
    animation: ${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
    color: #e8f5e8;
`;

const Heading = styled.h2`
    font-size: 1.05rem; font-weight: 700; color: #e8f5e8;
    margin: 0 0 4px; letter-spacing: -0.025em;
`;
const Sub = styled.p`font-size:0.775rem;color:#3d5c3d;margin:0 0 24px;`;

const Card = styled.div<{ $delay?: number }>`
    background: #0e140e;
    border: 1px solid rgba(8,205,0,0.1);
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 14px;
    animation: ${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay: ${p => p.$delay || 0}ms;
`;
const CardTitle = styled.div`font-size:0.75rem;font-weight:700;color:#3d5c3d;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;`;

/* MC Preview */
const McPreview = styled.div`
    background: #1a1a1a;
    border: 2px solid #3a3a3a;
    border-radius: 4px;
    padding: 10px 14px;
    font-family: 'Minecraft', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    min-height: 72px;
    position: relative;
    overflow: hidden;
    &::before {
        content: '';
        position: absolute; inset: 0;
        background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 16px,
            rgba(255,255,255,0.015) 16px,
            rgba(255,255,255,0.015) 17px
        );
        pointer-events: none;
    }
`;

const McLine = styled.div`display:flex;flex-wrap:wrap;align-items:baseline;`;

const McSpan = styled.span<{ $color?: string; $bold?: boolean; $italic?: boolean; $under?: boolean; $strike?: boolean }>`
    color: ${p => p.$color || '#aaaaaa'};
    font-weight: ${p => p.$bold ? 'bold' : 'normal'};
    font-style: ${p => p.$italic ? 'italic' : 'normal'};
    text-decoration: ${p => [p.$under && 'underline', p.$strike && 'line-through'].filter(Boolean).join(' ') || 'none'};
    white-space: pre;
`;

const McServerRow = styled.div`
    display: flex; align-items: flex-start; gap: 10px; padding: 6px 0;
`;
const McIcon = styled.div`
    width: 56px; height: 56px; border-radius: 4px;
    background: #2a2a2a; border: 1px solid #3a3a3a;
    flex-shrink: 0; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    color: #555; font-size: 0.7rem; text-align: center;
    img { width:100%;height:100%;object-fit:cover;image-rendering:pixelated; }
`;
const McRight = styled.div`flex:1;min-width:0;`;
const McServerName = styled.div`font-size:13px;color:#ffffff;font-weight:bold;margin-bottom:4px;font-family:'Courier New',monospace;`;
const McPlayers = styled.div`font-size:11px;color:#555555;font-family:'Courier New',monospace;`;

/* Input area */
const TextareaWrap = styled.div`position:relative;`;
const Textarea = styled.textarea`
    width: 100%; min-height: 80px;
    background: #0a0f0a; border: 1px solid rgba(8,205,0,0.14);
    border-radius: 8px; color: #e8f5e8;
    font-size: 0.85rem; font-family: 'Inter', sans-serif;
    padding: 10px 12px; outline: none; resize: vertical;
    transition: border-color 0.15s; line-height: 1.6;
    &:focus { border-color: rgba(8,205,0,0.35); }
    &::placeholder { color: #2a3d2a; }
`;
const CharCount = styled.div<{ $warn?: boolean }>`
    font-size: 0.68rem;
    color: ${p => p.$warn ? '#ef4444' : '#3d5c3d'};
    text-align: right;
    margin-top: 4px;
`;

/* Toolbar */
const Toolbar = styled.div`display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;`;

const ColorBtn = styled.button<{ $color: string }>`
    width: 22px; height: 22px; border-radius: 4px;
    background: ${p => p.$color};
    border: 1.5px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: transform 0.1s, border-color 0.1s;
    title: attr(title);
    &:hover { transform:scale(1.25); border-color: rgba(255,255,255,0.4); }
`;

const FmtBtn = styled.button<{ $css?: string }>`
    padding: 3px 9px; border-radius: 5px;
    background: #162016; border: 1px solid rgba(8,205,0,0.14);
    color: #7aab78; font-size: 0.75rem; font-weight: 700;
    cursor: pointer; transition: all 0.12s;
    ${p => p.$css ? css`${p.$css};` : ''}
    &:hover { border-color: rgba(8,205,0,0.3); color: #e8f5e8; }
`;

const Row = styled.div`display:flex;align-items:center;gap:10px;flex-wrap:wrap;`;

const Btn = styled.button<{ $variant?: 'primary' | 'ghost' }>`
    display: flex; align-items: center; gap: 6px;
    padding: 8px 18px; border-radius: 8px;
    font-size: 0.8rem; font-weight: 600; font-family: 'Inter', sans-serif;
    cursor: pointer; transition: all 0.15s;
    ${p => p.$variant === 'ghost'
        ? 'background:#0e140e;border:1px solid rgba(8,205,0,0.14);color:#3d5c3d;&:hover{border-color:rgba(8,205,0,0.3);color:#7aab78;}'
        : 'background:#08cd00;border:none;color:#0a0f0a;&:hover:not(:disabled){background:#07b300;}&:disabled{opacity:0.4;cursor:default;}'
    }
`;

const Toast = styled.div<{ $ok?: boolean }>`
    display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;
    font-size:0.775rem;font-weight:500;margin-bottom:16px;
    ${p => p.$ok
        ? 'background:rgba(8,205,0,0.09);border:1px solid rgba(8,205,0,0.25);color:#08cd00;'
        : 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;'
    }
`;

const Divider = styled.div`height:1px;background:linear-gradient(90deg,transparent,rgba(8,205,0,0.15),transparent);margin:4px 0 12px;`;

/* ─── Presets ────────────────────────────────────────────────── */
const PRESETS = [
    { label: 'Rainbow', value: '§cW§6e§el§ac§bo§9m§5e §7to §f§lMy Server' },
    { label: 'Classic', value: '§6§lWelcome §r§7| §aJoin and have fun!' },
    { label: 'Minimal', value: '§f§l◆ §r§7A Minecraft Server' },
    { label: 'SMP', value: '§2§l⚡ §r§aSurvival §8| §71.21 §8| §aBedrock + Java' },
    { label: 'Duels', value: '§c§lDuels §r§8| §eRank up §8| §b1v1 §8| §fplay.server.net' },
];

/* ─── Component ──────────────────────────────────────────────── */
export default function MotdContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [motd, setMotd] = useState('§6§lA Minecraft Server\\n§7Welcome! Join and play.');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [rawProps, setRawProps] = useState('');
    const [serverIcon, setServerIcon] = useState<string | null>(null);

    /* Load current motd from server.properties */
    useEffect(() => {
        setLoading(true);
        getFileContents(uuid, '/server.properties')
            .then(raw => {
                setRawProps(raw);
                const match = raw.match(/^motd=(.*)$/m);
                if (match) setMotd(match[1]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [uuid]);

    /* Try to load server-icon.png as base64 preview */
    useEffect(() => {
        getFileContents(uuid, '/server-icon.png')
            .then(data => {
                if (data && data.startsWith('data:')) setServerIcon(data);
            })
            .catch(() => {});
    }, [uuid]);

    const insertAt = (text: string) => {
        const el = textareaRef.current;
        if (!el) { setMotd(m => m + text); return; }
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next = motd.slice(0, start) + text + motd.slice(end);
        setMotd(next);
        setTimeout(() => { el.selectionStart = el.selectionEnd = start + text.length; el.focus(); }, 0);
    };

    const save = async () => {
        if (!rawProps) return;
        setSaving(true); setToast(null);
        try {
            const updated = rawProps.replace(/^motd=.*$/m, `motd=${motd}`);
            await saveFileContents(uuid, '/server.properties', updated);
            setToast({ msg: 'MOTD saved successfully! Restart your server to apply.', ok: true });
        } catch (e: any) {
            setToast({ msg: e?.message || 'Failed to save MOTD.', ok: false });
        } finally { setSaving(false); }
    };

    /* Render MOTD lines */
    const lines = motd.split('\\n');
    const renderLine = (raw: string) => {
        const segs = parseMOTD(raw);
        return segs.map((s, i) => (
            <McSpan key={i} $color={s.color} $bold={s.bold} $italic={s.italic} $under={s.underline} $strike={s.strike}>
                {s.text}
            </McSpan>
        ));
    };

    return (
        <Page>
            <Heading>MOTD Maker</Heading>
            <Sub>Design your server's Message of the Day with live Minecraft preview.</Sub>

            {toast && (
                <Toast $ok={toast.ok}>
                    <FontAwesomeIcon icon={toast.ok ? faCheckCircle : faExclamationTriangle}/>
                    {toast.msg}
                </Toast>
            )}

            {/* Live Preview */}
            <Card $delay={0}>
                <CardTitle>Live Preview</CardTitle>
                <McPreview>
                    <McServerRow>
                        <McIcon>
                            {serverIcon ? <img src={serverIcon} alt='icon'/> : 'No Icon'}
                        </McIcon>
                        <McRight>
                            <McServerName>A Minecraft Server</McServerName>
                            {lines.map((line, i) => (
                                <McLine key={i}>{renderLine(line)}</McLine>
                            ))}
                            <McPlayers>● 0/20</McPlayers>
                        </McRight>
                        <div style={{fontSize:'11px',color:'#555',fontFamily:'Courier New',textAlign:'right',lineHeight:1.6}}>
                            <div>0/20</div>
                            <div style={{fontSize:'9px',marginTop:'2px'}}>■■■■□</div>
                        </div>
                    </McServerRow>
                </McPreview>
            </Card>

            {/* Editor */}
            <Card $delay={60}>
                <CardTitle>Editor</CardTitle>

                {/* Color palette */}
                <Toolbar>
                    {MC_COLORS.map(c => (
                        <ColorBtn
                            key={c.code}
                            $color={c.color}
                            title={`${c.name} (${c.code})`}
                            onClick={() => insertAt(c.code)}
                        />
                    ))}
                </Toolbar>

                <Divider/>

                {/* Format buttons */}
                <Toolbar style={{marginBottom:'12px'}}>
                    {MC_FORMATS.map(f => (
                        <FmtBtn key={f.code} $css={f.css} title={f.code} onClick={() => insertAt(f.code)}>
                            {f.label}
                        </FmtBtn>
                    ))}
                    <FmtBtn onClick={() => insertAt('\\n')} title='New line'>⏎ New Line</FmtBtn>
                </Toolbar>

                <TextareaWrap>
                    <Textarea
                        ref={textareaRef}
                        value={motd}
                        onChange={e => setMotd(e.target.value)}
                        placeholder='§6§lWelcome §r§7to my server!'
                        spellCheck={false}
                    />
                </TextareaWrap>
                <CharCount $warn={motd.length > 59}>{motd.length} / 59 chars</CharCount>
            </Card>

            {/* Presets */}
            <Card $delay={120}>
                <CardTitle>Presets</CardTitle>
                <Toolbar>
                    {PRESETS.map(p => (
                        <FmtBtn key={p.label} onClick={() => setMotd(p.value)}>{p.label}</FmtBtn>
                    ))}
                </Toolbar>
            </Card>

            {/* Actions */}
            <Row>
                <Btn $variant='ghost' onClick={() => setMotd('§6§lA Minecraft Server\\n§7Welcome!')} title='Reset'>
                    Reset
                </Btn>
                <Btn
                    onClick={save}
                    disabled={saving || loading}
                >
                    {saving
                        ? <><FontAwesomeIcon icon={faSync} spin/> Saving...</>
                        : <><FontAwesomeIcon icon={faSave}/> Save MOTD</>
                    }
                </Btn>
            </Row>
        </Page>
    );
}
