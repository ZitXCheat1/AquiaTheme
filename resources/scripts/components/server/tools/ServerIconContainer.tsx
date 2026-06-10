import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components/macro';
import { keyframes } from 'styled-components';
import { ServerContext } from '@/state/server';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faCheckCircle, faExclamationTriangle, faImage, faTimes } from '@fortawesome/free-solid-svg-icons';

/* ─── Keyframes ──────────────────────────────────────────────── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}`;
const pulse = keyframes`0%,100%{opacity:0.6;}50%{opacity:1;}`;
const spin = keyframes`to{transform:rotate(360deg);}`;

/* ─── Styled ─────────────────────────────────────────────────── */
const Page = styled.div`
    padding: 28px;
    max-width: 720px;
    font-family: 'Inter', sans-serif;
    animation: ${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
    color: #e8f5e8;
`;
const Heading = styled.h2`font-size:1.05rem;font-weight:700;color:#ffffff;margin:0 0 4px;letter-spacing:-0.025em;`;
const Sub = styled.p`font-size:0.775rem;color:#94a3b8;margin:0 0 24px;`;

const Card = styled.div<{ $delay?: number }>`
    background: #0e140e;
    border: 1px solid rgba(8,205,0,0.1);
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 14px;
    animation: ${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay: ${p => p.$delay || 0}ms;
`;
const CardTitle = styled.div`font-size:0.75rem;font-weight:700;color:#3d5c3d;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:14px;`;

/* Upload zone */
const DropZone = styled.label<{ $dragging?: boolean; $hasFile?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 160px;
    border-radius: 10px;
    border: 2px dashed ${p => p.$dragging ? '#08cd00' : p.$hasFile ? 'rgba(8,205,0,0.4)' : 'rgba(8,205,0,0.15)'};
    background: ${p => p.$dragging ? 'rgba(8,205,0,0.06)' : 'rgba(8,205,0,0.02)'};
    cursor: pointer;
    transition: all 0.2s;
    &:hover { border-color: rgba(8,205,0,0.35); background: rgba(8,205,0,0.04); }
`;
const DropIcon = styled.div`
    font-size: 2rem;
    color: ${(p: any) => p.active ? '#08cd00' : '#3d5c3d'};
    transition: color 0.2s;
`;
const DropText = styled.div`font-size:0.825rem;color:#3d5c3d;text-align:center;`;
const DropSub = styled.div`font-size:0.7rem;color:#2a3d2a;margin-top:2px;`;

/* Preview area - Minecraft server list style */
const PreviewWrap = styled.div`
    background: #1a1a1a;
    border: 2px solid #3a3a3a;
    border-radius: 6px;
    padding: 10px 14px;
    position: relative;
    overflow: hidden;
    &::before {
        content: '';
        position: absolute; inset: 0;
        background: repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(255,255,255,0.015) 20px,rgba(255,255,255,0.015) 21px);
        pointer-events: none;
    }
`;

const ServerRow = styled.div`display:flex;align-items:flex-start;gap:10px;`;

const ServerIcon = styled.div`
    width: 64px; height: 64px;
    border-radius: 4px;
    background: #2a2a2a;
    border: 1px solid #444;
    flex-shrink: 0;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    color: #555; font-size: 0.6rem; text-align: center;
    line-height: 1.3;
    img {
        width: 100%; height: 100%;
        object-fit: cover;
        image-rendering: pixelated;
    }
`;

const ServerInfo = styled.div`flex:1;min-width:0;`;
const ServerName = styled.div`font-size:13px;color:#ffffff;font-weight:bold;font-family:'Courier New',monospace;margin-bottom:3px;`;
const Motd = styled.div`font-size:12px;color:#AAAAAA;font-family:'Courier New',monospace;line-height:1.5;`;
const MotdLine2 = styled.div`font-size:12px;color:#55FF55;font-family:'Courier New',monospace;`;
const PingArea = styled.div`text-align:right;font-family:'Courier New',monospace;font-size:11px;color:#555;line-height:1.7;flex-shrink:0;`;

/* Comparison row */
const CompareRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 16px;
`;

const CompareBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
`;

const CompareLabel = styled.div`font-size:0.68rem;font-weight:600;color:#3d5c3d;text-transform:uppercase;letter-spacing:0.08em;`;

const IconPreview = styled.div<{ $size: number }>`
    width: ${p => p.$size}px; height: ${p => p.$size}px;
    border-radius: 6px;
    border: 1px solid rgba(8,205,0,0.2);
    background: #0a0f0a;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    color: #3d5c3d; font-size: 0.7rem;
    img {
        width: 100%; height: 100%;
        object-fit: cover;
        image-rendering: pixelated;
    }
`;

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
`;

const InfoBox = styled.div`
    background: #0a0f0a;
    border: 1px solid rgba(8,205,0,0.08);
    border-radius: 8px;
    padding: 10px 12px;
`;
const InfoLabel = styled.div`font-size:0.65rem;font-weight:600;color:#3d5c3d;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;`;
const InfoValue = styled.div`font-size:0.85rem;font-weight:600;color:#e8f5e8;`;

/* Buttons */
const BtnRow = styled.div`display:flex;gap:8px;flex-wrap:wrap;align-items:center;`;

const Btn = styled.button<{ $variant?: 'primary' | 'danger' | 'ghost' }>`
    display: flex; align-items: center; gap: 6px;
    padding: 8px 18px; border-radius: 8px;
    font-size: 0.8rem; font-weight: 600; font-family: 'Inter', sans-serif;
    cursor: pointer; transition: all 0.15s;
    ${p => p.$variant === 'ghost'
        ? 'background:#0e140e;border:1px solid rgba(8,205,0,0.14);color:#3d5c3d;&:hover{border-color:rgba(8,205,0,0.3);color:#7aab78;}'
        : p.$variant === 'danger'
        ? 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;&:hover{background:rgba(239,68,68,0.15);}'
        : 'background:#08cd00;border:none;color:#0a0f0a;&:hover:not(:disabled){background:#07b300;}&:disabled{opacity:0.4;cursor:default;}'
    }
`;

const Spinner = styled.div`
    width:14px;height:14px;border:2px solid rgba(10,15,10,0.3);
    border-top-color:#0a0f0a;border-radius:50%;
    animation:${spin} 0.7s linear infinite;
`;

const Toast = styled.div<{ $ok?: boolean }>`
    display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;
    font-size:0.775rem;font-weight:500;margin-bottom:16px;
    animation:${fadeUp} 0.3s ease both;
    ${p => p.$ok
        ? 'background:rgba(8,205,0,0.09);border:1px solid rgba(8,205,0,0.25);color:#08cd00;'
        : 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;'
    }
`;

const RequirementRow = styled.div`display:flex;align-items:center;gap:8px;font-size:0.775rem;color:#4b5563;`;
const Req = styled.span<{ $met?: boolean }>`color:${p=>p.$met?'#08cd00':'#ef4444'};font-weight:600;`;

/* ─── Utils ──────────────────────────────────────────────────── */
function resizeToCanvas(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, 64, 64);
            resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(url);
        };
        img.onerror = reject;
        img.src = url;
    });
}

/* ─── Component ──────────────────────────────────────────────── */
export default function ServerIconContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [originalPreview, setOriginalPreview] = useState<string | null>(null);
    const [resizedPreview, setResizedPreview] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);
    const [fileName, setFileName] = useState('');
    const [fileBlob, setFileBlob] = useState<Blob | null>(null);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const processFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setToast({ msg: 'Please select a PNG or JPG image.', ok: false });
            return;
        }
        setFileName(file.name);
        const rawUrl = URL.createObjectURL(file);
        setOriginalPreview(rawUrl);

        const { dataUrl, width, height } = await resizeToCanvas(file);
        setOriginalSize({ w: width, h: height });
        setResizedPreview(dataUrl);

        const res = await fetch(dataUrl);
        setFileBlob(await res.blob());
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const upload = async () => {
        if (!fileBlob) return;
        setUploading(true); setToast(null);
        try {
            const url = await getFileUploadUrl(uuid);
            const form = new FormData();
            form.append('files', fileBlob, 'server-icon.png');
            const res = await fetch(`${url}&directory=/`, { method: 'POST', body: form });
            if (!res.ok) throw new Error(`Upload failed (${res.status})`);
            setToast({ msg: 'Server icon uploaded! Restart your server to apply.', ok: true });
        } catch (e: any) {
            setToast({ msg: e?.message || 'Upload failed.', ok: false });
        } finally { setUploading(false); }
    };

    const clear = () => {
        setOriginalPreview(null); setResizedPreview(null);
        setOriginalSize(null); setFileName(''); setFileBlob(null);
        setToast(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const isSquare = originalSize ? originalSize.w === originalSize.h : null;
    const isPng = fileName.toLowerCase().endsWith('.png');

    return (
        <Page>
            <Heading>Server Icon</Heading>
            <Sub>Upload a custom icon that appears in the Minecraft server list. Must be a 64×64 PNG.</Sub>

            {toast && (
                <Toast $ok={toast.ok}>
                    <FontAwesomeIcon icon={toast.ok ? faCheckCircle : faExclamationTriangle}/>
                    {toast.msg}
                </Toast>
            )}

            {/* Drop Zone */}
            <Card $delay={0}>
                <CardTitle>Upload Image</CardTitle>
                <input
                    ref={inputRef}
                    type='file'
                    accept='image/png,image/jpeg,image/jpg'
                    style={{ display: 'none' }}
                    onChange={onFileChange}
                />
                <DropZone
                    $dragging={dragging}
                    $hasFile={!!resizedPreview}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    {resizedPreview ? (
                        <>
                            <img src={resizedPreview} alt='preview' style={{width:80,height:80,borderRadius:8,imageRendering:'pixelated',border:'2px solid rgba(8,205,0,0.3)'}}/>
                            <DropText style={{color:'#7aab78'}}>Click to choose a different image</DropText>
                        </>
                    ) : (
                        <>
                            <DropIcon as='div' style={{fontSize:'2rem',color:'#3d5c3d'}}>
                                <FontAwesomeIcon icon={faImage}/>
                            </DropIcon>
                            <div>
                                <DropText>Drop image here or click to browse</DropText>
                                <DropSub>PNG, JPG supported · Will be resized to 64×64</DropSub>
                            </div>
                        </>
                    )}
                </DropZone>
            </Card>

            {/* Live Preview */}
            {resizedPreview && (
                <>
                    {/* Requirements */}
                    <Card $delay={40}>
                        <CardTitle>Validation</CardTitle>
                        <InfoGrid>
                            <InfoBox>
                                <InfoLabel>Original Size</InfoLabel>
                                <InfoValue>{originalSize?.w ?? '?'} × {originalSize?.h ?? '?'} px</InfoValue>
                            </InfoBox>
                            <InfoBox>
                                <InfoLabel>Output Size</InfoLabel>
                                <InfoValue style={{color:'#08cd00'}}>64 × 64 px ✓</InfoValue>
                            </InfoBox>
                        </InfoGrid>
                        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                            <RequirementRow>
                                <Req $met={isPng}>●</Req>
                                PNG format {isPng ? '✓' : '— will be converted'}
                            </RequirementRow>
                            <RequirementRow>
                                <Req $met>●</Req>
                                64×64 pixels ✓ (auto-resized)
                            </RequirementRow>
                            <RequirementRow>
                                <Req $met={isSquare ?? undefined}>●</Req>
                                Square aspect ratio {isSquare ? '✓' : isSquare === false ? '— will be stretched to fit' : ''}
                            </RequirementRow>
                        </div>
                    </Card>

                    {/* Minecraft preview */}
                    <Card $delay={80}>
                        <CardTitle>Minecraft Server List Preview</CardTitle>
                        <PreviewWrap>
                            <ServerRow>
                                <ServerIcon>
                                    <img src={resizedPreview} alt='icon'/>
                                </ServerIcon>
                                <ServerInfo>
                                    <ServerName>A Minecraft Server</ServerName>
                                    <Motd>§6Welcome to the server!</Motd>
                                    <MotdLine2>Join us and have fun ✦</MotdLine2>
                                </ServerInfo>
                                <PingArea>
                                    <div>0/20</div>
                                    <div style={{fontSize:'10px',color:'#08cd00'}}>■■■■■</div>
                                </PingArea>
                            </ServerRow>
                        </PreviewWrap>

                        <CompareRow>
                            <CompareBox>
                                <CompareLabel>Original</CompareLabel>
                                <IconPreview $size={96}>
                                    {originalPreview && <img src={originalPreview} alt='original'/>}
                                </IconPreview>
                                <div style={{fontSize:'0.68rem',color:'#3d5c3d'}}>
                                    {originalSize?.w}×{originalSize?.h}
                                </div>
                            </CompareBox>
                            <CompareBox>
                                <CompareLabel>Resized (64×64)</CompareLabel>
                                <IconPreview $size={96}>
                                    <img src={resizedPreview} alt='resized'/>
                                </IconPreview>
                                <div style={{fontSize:'0.68rem',color:'#08cd00'}}>Ready to upload</div>
                            </CompareBox>
                        </CompareRow>
                    </Card>

                    {/* Actions */}
                    <BtnRow>
                        <Btn $variant='ghost' onClick={clear}>
                            <FontAwesomeIcon icon={faTimes}/> Clear
                        </Btn>
                        <Btn onClick={upload} disabled={uploading || !fileBlob}>
                            {uploading ? <Spinner/> : <FontAwesomeIcon icon={faUpload}/>}
                            {uploading ? 'Uploading...' : 'Upload Icon'}
                        </Btn>
                    </BtnRow>
                </>
            )}
        </Page>
    );
}
