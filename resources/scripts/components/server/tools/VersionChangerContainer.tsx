import React, { useState, useEffect } from 'react';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import reinstallServer from '@/api/server/reinstallServer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faSync } from '@fortawesome/free-solid-svg-icons';

/* ─── Types ─────────────────────────────────────────────────── */
type Software = 'paper' | 'purpur' | 'vanilla' | 'spigot';

const SOFTWARE_OPTIONS: { id: Software; label: string; color: string; icon: string }[] = [
    { id: 'paper', label: 'Paper', color: '#22c55e', icon: '📄' },
    { id: 'purpur', label: 'Purpur', color: '#a855f7', icon: '🟣' },
    { id: 'vanilla', label: 'Vanilla', color: '#eab308', icon: '🌿' },
    { id: 'spigot', label: 'Spigot', color: '#f97316', icon: '🔧' },
];

/* ─── Styled ─────────────────────────────────────────────────── */
const Page = styled.div`
    padding: 24px;
    max-width: 680px;
    color: #e2e8f0;
`;

const Card = styled.div`
    background: #13131f;
    border: 1px solid rgba(99, 102, 241, 0.14);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
`;

const CardTitle = styled.h3`
    font-size: 0.95rem;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0 0 6px;
`;

const CardSub = styled.p`
    font-size: 0.78rem;
    color: #4b5563;
    margin: 0 0 20px;
    line-height: 1.5;
`;

const CurrentBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 6px;
    padding: 3px 10px;
    margin-bottom: 20px;
`;

const StyledSelect = styled.select`
    width: 100%;
    background: #1a1a2b;
    border: 1px solid rgba(99, 102, 241, 0.18);
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.875rem;
    padding: 10px 12px;
    outline: none;
    cursor: pointer;
    margin-bottom: 12px;
    transition: border-color 0.15s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;

    &:hover, &:focus { border-color: rgba(99, 102, 241, 0.4); }
    option { background: #1a1a2b; }
`;

const DangerBox = styled.div`
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    padding: 14px 16px;
    margin-top: 12px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
`;

const DangerIcon = styled.div`
    color: #ef4444;
    margin-top: 1px;
    flex-shrink: 0;
`;

const DangerText = styled.div`
    font-size: 0.78rem;
    color: #94a3b8;
    line-height: 1.5;
    flex: 1;
`;

const CheckRow = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    cursor: pointer;
    font-size: 0.78rem;
    color: #64748b;
    user-select: none;

    input { accent-color: #ef4444; cursor: pointer; }
`;

const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
`;

const PoweredBy = styled.span`
    font-size: 0.72rem;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const InstallBtn = styled.button<{ loading?: boolean }>`
    padding: 9px 20px;
    background: #6366f1;
    border: 1px solid #6366f1;
    border-radius: 8px;
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover:not(:disabled) { background: #5558e8; }
    &:disabled { opacity: 0.5; cursor: default; }
`;

const Toast = styled.div<{ success?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
    margin-bottom: 16px;

    ${p => p.success
        ? 'background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25); color: #22c55e;'
        : 'background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444;'
    }
`;

/* ─── MC Version helpers ─────────────────────────────────────── */
async function fetchPaperVersions(): Promise<string[]> {
    const res = await fetch('https://api.papermc.io/v2/projects/paper');
    const data = await res.json();
    return [...(data.versions || [])].reverse();
}

async function fetchPurpurVersions(): Promise<string[]> {
    const res = await fetch('https://api.purpurmc.org/v2/purpur');
    const data = await res.json();
    return [...(data.versions || [])].reverse();
}

async function fetchVanillaVersions(): Promise<string[]> {
    const res = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    const data = await res.json();
    return data.versions
        .filter((v: any) => v.type === 'release')
        .map((v: any) => v.id);
}

/* ─── Component ──────────────────────────────────────────────── */
export default function VersionChangerContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);

    const [software, setSoftware] = useState<Software>('paper');
    const [versions, setVersions] = useState<string[]>([]);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [resetFiles, setResetFiles] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingVersions, setFetchingVersions] = useState(false);
    const [toast, setToast] = useState<{ msg: string; success: boolean } | null>(null);

    useEffect(() => {
        setFetchingVersions(true);
        setVersions([]);
        setSelectedVersion('');

        const fetch = software === 'paper' ? fetchPaperVersions()
            : software === 'purpur' ? fetchPurpurVersions()
            : software === 'vanilla' ? fetchVanillaVersions()
            : fetchPaperVersions();

        fetch
            .then((v) => {
                setVersions(v);
                setSelectedVersion(v[0] || '');
            })
            .catch(() => setVersions([]))
            .finally(() => setFetchingVersions(false));
    }, [software]);

    const handleInstall = async () => {
        if (!selectedVersion) return;
        setLoading(true);
        setToast(null);

        try {
            await updateStartupVariable(uuid, 'MINECRAFT_VERSION', selectedVersion);
            await updateStartupVariable(uuid, 'BUILD_NUMBER', 'latest');

            if (resetFiles) {
                await reinstallServer(uuid);
            }

            setToast({ msg: `${SOFTWARE_OPTIONS.find(s => s.id === software)?.label} ${selectedVersion} has successfully been installed.`, success: true });
        } catch (e: any) {
            setToast({ msg: e?.message || 'Failed to update version.', success: false });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Page>
            {toast && (
                <Toast success={toast.success}>
                    <FontAwesomeIcon icon={toast.success ? faCheckCircle : faExclamationTriangle} />
                    {toast.msg}
                </Toast>
            )}

            <Card>
                <CardTitle>Version changer</CardTitle>
                <CardSub>
                    Easily switch your server to a different Minecraft version with a single click.
                </CardSub>

                <StyledSelect value={software} onChange={e => setSoftware(e.target.value as Software)}>
                    {SOFTWARE_OPTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                    ))}
                </StyledSelect>

                <StyledSelect
                    value={selectedVersion}
                    onChange={e => setSelectedVersion(e.target.value)}
                    disabled={fetchingVersions || versions.length === 0}
                >
                    {fetchingVersions
                        ? <option>Loading versions...</option>
                        : versions.length === 0
                        ? <option>No versions available</option>
                        : (
                            <>
                                <option value=''>Select a version</option>
                                {versions.map(v => <option key={v} value={v}>{v}</option>)}
                            </>
                        )
                    }
                </StyledSelect>

                <DangerBox>
                    <DangerIcon><FontAwesomeIcon icon={faExclamationTriangle} /></DangerIcon>
                    <DangerText>
                        <strong style={{ color: '#ef4444' }}>Danger zone</strong>
                        <CheckRow>
                            <input
                                type='checkbox'
                                checked={resetFiles}
                                onChange={e => setResetFiles(e.target.checked)}
                            />
                            Reset the server, and delete all files (worlds, configs, plugins etc)
                        </CheckRow>
                    </DangerText>
                </DangerBox>

                <Footer>
                    <PoweredBy>
                        Powered by <span style={{ color: '#818cf8', fontWeight: 600 }}>AquiaTheme</span>
                    </PoweredBy>
                    <InstallBtn onClick={handleInstall} disabled={loading || !selectedVersion}>
                        {loading && <FontAwesomeIcon icon={faSync} spin />}
                        Install
                    </InstallBtn>
                </Footer>
            </Card>
        </Page>
    );
}
