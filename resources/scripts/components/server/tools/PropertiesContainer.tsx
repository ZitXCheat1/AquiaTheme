import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSync, faSave, faImage, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

/* â”€â”€â”€ Property type detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type PropType = 'boolean' | 'enum' | 'number' | 'string';

const ENUM_PROPS: Record<string, string[]> = {
    gamemode: ['survival', 'creative', 'adventure', 'spectator'],
    difficulty: ['peaceful', 'easy', 'normal', 'hard'],
    'level-type': ['DEFAULT', 'FLAT', 'LARGEBIOMES', 'AMPLIFIED', 'BUFFET'],
    'default-player-permission-level': ['visitor', 'member', 'operator'],
};

const BOOLEAN_PROPS = new Set([
    'online-mode', 'pvp', 'allow-flight', 'allow-nether', 'hardcore',
    'enable-command-block', 'spawn-monsters', 'spawn-animals', 'spawn-npcs',
    'white-list', 'enforce-whitelist', 'enable-rcon', 'enable-query',
    'sync-chunk-writes', 'snooper-enabled', 'generate-structures',
    'require-resource-pack', 'broadcast-rcon-to-ops', 'broadcast-console-to-ops',
    'accepts-transfers', 'allow-flight',
]);

const NUMBER_PROPS = new Set([
    'max-players', 'server-port', 'query.port', 'rcon.port', 'view-distance',
    'simulation-distance', 'max-build-height', 'max-world-size',
    'network-compression-threshold', 'op-permission-level', 'spawn-protection',
    'entity-broadcast-range-percentage', 'max-tick-time', 'rate-limit',
    'player-idle-timeout',
]);

function detectType(key: string): PropType {
    if (ENUM_PROPS[key]) return 'enum';
    if (BOOLEAN_PROPS.has(key)) return 'boolean';
    if (NUMBER_PROPS.has(key)) return 'number';
    return 'string';
}

function parseProperties(raw: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        result[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1);
    }
    return result;
}

function serializeProperties(original: string, updated: Record<string, string>): string {
    const lines = original.split('\n');
    return lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) return line;
        const key = trimmed.slice(0, eqIdx).trim();
        return key in updated ? `${key}=${updated[key]}` : line;
    }).join('\n');
}

/* â”€â”€â”€ Styled â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Page = styled.div`
    padding: 24px;
    color: #ffffff;
`;

const TopBar = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
`;

const SearchWrap = styled.div`
    flex: 1;
    position: relative;
    svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #4b5563; font-size: 0.8rem; }
`;

const SearchInput = styled.input`
    width: 100%;
    background: #0e140e;
    border: 1px solid rgba(8, 205, 0, 0.18);
    border-radius: 8px;
    padding: 9px 12px 9px 34px;
    color: #ffffff;
    font-size: 0.875rem;
    outline: none;
    &::placeholder { color: #374151; }
    &:focus { border-color: rgba(8, 205, 0, 0.45); }
`;

const Btn = styled.button<{ variant?: 'primary' | 'ghost' | 'danger' }>`
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
        background: #08cd00; border-color: #08cd00; color: white;
        &:hover { background: #07b300; }
    ` : p.variant === 'danger' ? `
        background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.25); color: #ef4444;
        &:hover { background: rgba(239,68,68,0.18); }
    ` : `
        background: #0e140e; border-color: rgba(8,205,0,0.18); color: #94a3b8;
        &:hover { border-color: rgba(8,205,0,0.35); color: #ffffff; }
    `}

    &:disabled { opacity: 0.4; cursor: default; }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 10px;
`;

const PropCard = styled.div`
    background: #0e140e;
    border: 1px solid rgba(8, 205, 0, 0.1);
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: border-color 0.15s;
    &:hover { border-color: rgba(8, 205, 0, 0.22); }
`;

const PropLeft = styled.div`
    flex: 1;
    min-width: 0;
`;

const PropKey = styled.div`
    font-size: 0.8rem;
    font-weight: 500;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const ExtLink = styled.a`
    color: #374151;
    font-size: 0.65rem;
    &:hover { color: #4ade80; }
`;

const PropValue = styled.div`
    font-size: 0.72rem;
    color: #4b5563;
    margin-top: 2px;
    font-family: monospace;
`;

/* Toggle */
const ToggleWrap = styled.label`
    position: relative;
    width: 38px;
    height: 20px;
    flex-shrink: 0;
    cursor: pointer;
`;

const ToggleInput = styled.input`
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + span { background: #08cd00; }
    &:checked + span::before { transform: translateX(18px); }
`;

const ToggleSlider = styled.span`
    position: absolute;
    inset: 0;
    background: #111611;
    border-radius: 20px;
    transition: background 0.15s;
    border: 1px solid rgba(8,205,0,0.2);

    &::before {
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        left: 2px;
        bottom: 2px;
        background: white;
        border-radius: 50%;
        transition: transform 0.15s;
    }
`;

/* Enum buttons */
const EnumWrap = styled.div`
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
`;

const EnumBtn = styled.button<{ active?: boolean }>`
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.12s;

    ${p => p.active
        ? 'background: #08cd00; border-color: #08cd00; color: white;'
        : 'background: #0a0f0a; border-color: rgba(8,205,0,0.15); color: #64748b; &:hover { border-color: rgba(8,205,0,0.3); color: #94a3b8; }'
    }
`;

/* Input */
const PropInput = styled.input`
    background: #0a0f0a;
    border: 1px solid rgba(8, 205, 0, 0.18);
    border-radius: 6px;
    color: #ffffff;
    font-size: 0.78rem;
    padding: 5px 10px;
    outline: none;
    width: 130px;
    transition: border-color 0.15s;
    &:focus { border-color: rgba(8, 205, 0, 0.45); }
`;

const SavedBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    color: #22c55e;
`;

const Empty = styled.div`
    text-align: center;
    padding: 60px;
    color: #374151;
    font-size: 0.875rem;
`;

/* Icon Changer card */
const IconCard = styled.div`
    background: #0e140e;
    border: 1px solid rgba(8, 205, 0, 0.14);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
`;

const IconPreview = styled.div`
    width: 64px;
    height: 64px;
    border-radius: 10px;
    background: #0a0f0a;
    border: 1px solid rgba(8,205,0,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
`;

const IconInfo = styled.div`
    flex: 1;
    h4 { font-size: 0.875rem; font-weight: 600; color: #ffffff; margin: 0 0 4px; }
    p { font-size: 0.75rem; color: #4b5563; margin: 0 0 10px; }
`;

/* â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function PropertiesContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const [rawContent, setRawContent] = useState('');
    const [props, setProps] = useState<Record<string, string>>({});
    const [dirty, setDirty] = useState<Record<string, string>>({});
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [uploadingIcon, setUploadingIcon] = useState(false);
    const iconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getFileContents(uuid, '/server.properties')
            .then(raw => {
                setRawContent(raw);
                setProps(parseProperties(raw));
            })
            .catch(() => {/* server.properties not found */})
            .finally(() => setLoading(false));

        getFileContents(uuid, '/server-icon.png')
            .then(data => setIconPreview(`data:image/png;base64,${btoa(data)}`))
            .catch(() => {/* no icon */});
    }, [uuid]);

    const update = (key: string, value: string) => {
        setDirty(d => ({ ...d, [key]: value }));
        setProps(p => ({ ...p, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const updated = serializeProperties(rawContent, { ...props, ...dirty });
            await saveFileContents(uuid, '/server.properties', updated);
            setRawContent(updated);
            setDirty({});
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingIcon(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise(res => { img.onload = res; });
            ctx.drawImage(img, 0, 0, 64, 64);
            const dataUrl = canvas.toDataURL('image/png');
            setIconPreview(dataUrl);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const uploadUrl = await getFileUploadUrl(uuid);
                const form = new FormData();
                form.append('files', blob, 'server-icon.png');
                await fetch(`${uploadUrl}&directory=/`, { method: 'POST', body: form });
                setUploadingIcon(false);
            }, 'image/png');
        } catch {
            setUploadingIcon(false);
        }
    };

    const allProps = Object.entries(props);
    const filtered = search
        ? allProps.filter(([k]) => k.toLowerCase().includes(search.toLowerCase()))
        : allProps;

    return (
        <Page>
            <TopBar>
                <SearchWrap>
                    <FontAwesomeIcon icon={faSearch} />
                    <SearchInput
                        placeholder='Search for property...'
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </SearchWrap>
                {saved && (
                    <SavedBadge>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Saved
                    </SavedBadge>
                )}
                <Btn variant='primary' onClick={handleSave} disabled={saving || loading}>
                    {saving ? <FontAwesomeIcon icon={faSync} spin /> : <FontAwesomeIcon icon={faSave} />}
                    Save Changes
                </Btn>
            </TopBar>

            {/* Icon changer */}
            <IconCard>
                <IconPreview>
                    {iconPreview
                        ? <img src={iconPreview} alt='server icon' />
                        : <FontAwesomeIcon icon={faImage} style={{ color: '#374151', fontSize: '1.5rem' }} />
                    }
                </IconPreview>
                <IconInfo>
                    <h4>Server Icon</h4>
                    <p>Upload a PNG image. It will be automatically resized to 64Ã—64.</p>
                    <input
                        ref={iconInputRef}
                        type='file'
                        accept='image/*'
                        style={{ display: 'none' }}
                        onChange={handleIconUpload}
                    />
                    <Btn
                        onClick={() => iconInputRef.current?.click()}
                        disabled={uploadingIcon}
                    >
                        {uploadingIcon
                            ? <><FontAwesomeIcon icon={faSync} spin /> Uploading...</>
                            : <><FontAwesomeIcon icon={faImage} /> Upload Minecraft Icon</>
                        }
                    </Btn>
                </IconInfo>
            </IconCard>

            {loading ? (
                <Empty><FontAwesomeIcon icon={faSync} spin /> Loading server.properties...</Empty>
            ) : filtered.length === 0 ? (
                <Empty>No properties found{search ? ` matching "${search}"` : ''}.</Empty>
            ) : (
                <Grid>
                    {filtered.map(([key, value]) => {
                        const type = detectType(key);
                        return (
                            <PropCard key={key}>
                                <PropLeft>
                                    <PropKey>
                                        {key}
                                        <ExtLink
                                            href={`https://minecraft.wiki/w/Server.properties#${key}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            title='Wiki'
                                        >
                                            â†—
                                        </ExtLink>
                                    </PropKey>
                                    <PropValue>{value || 'â€”'}</PropValue>
                                </PropLeft>

                                {type === 'boolean' ? (
                                    <ToggleWrap>
                                        <ToggleInput
                                            type='checkbox'
                                            checked={value === 'true'}
                                            onChange={e => update(key, e.target.checked ? 'true' : 'false')}
                                        />
                                        <ToggleSlider />
                                    </ToggleWrap>
                                ) : type === 'enum' ? (
                                    <EnumWrap>
                                        {ENUM_PROPS[key].map(opt => (
                                            <EnumBtn
                                                key={opt}
                                                active={value === opt}
                                                onClick={() => update(key, opt)}
                                            >
                                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                            </EnumBtn>
                                        ))}
                                    </EnumWrap>
                                ) : (
                                    <PropInput
                                        type={type === 'number' ? 'number' : 'text'}
                                        value={value}
                                        onChange={e => update(key, e.target.value)}
                                    />
                                )}
                            </PropCard>
                        );
                    })}
                </Grid>
            )}
        </Page>
    );
}

