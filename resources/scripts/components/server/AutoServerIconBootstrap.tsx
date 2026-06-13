import { useEffect } from 'react';
import { ServerContext } from '@/state/server';
import loadDirectory from '@/api/server/files/loadDirectory';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';

/**
 * On first mount per server, check whether /server-icon.png exists in the
 * server root. If not, render the AquiaTheme logo to a 64x64 PNG via canvas
 * and upload it so Minecraft has an icon to show in the server list.
 *
 * Idempotent per session: a sessionStorage flag prevents repeat checks while
 * the user navigates between server tabs.
 */
function drawAquiaLogo(): Promise<Blob | null> {
    return new Promise((resolve) => {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        if (!ctx) return resolve(null);

        // backdrop
        ctx.fillStyle = '#0a0f0a';
        ctx.fillRect(0, 0, 64, 64);

        // subtle scanline grid
        ctx.fillStyle = 'rgba(8,205,0,0.04)';
        for (let y = 0; y < 64; y += 3) ctx.fillRect(0, y, 64, 1);

        // two server units (top + bottom)
        const drawUnit = (y: number) => {
            ctx.fillStyle = '#111611';
            ctx.strokeStyle = '#08cd00';
            ctx.lineWidth = 1.2;
            roundRect(ctx, 8, y, 48, 14, 3);
            ctx.fill(); ctx.stroke();

            // status slot
            ctx.fillStyle = '#1a2a1a';
            roundRect(ctx, 12, y + 4, 22, 6, 1.5);
            ctx.fill();

            // status LEDs
            ctx.fillStyle = '#08cd00';
            ctx.beginPath(); ctx.arc(40, y + 7, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(8,205,0,0.4)';
            ctx.beginPath(); ctx.arc(46, y + 7, 2.5, 0, Math.PI * 2); ctx.fill();
        };
        drawUnit(14);
        drawUnit(33);

        // soft border
        ctx.strokeStyle = 'rgba(8,205,0,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, 63, 63);

        c.toBlob((b) => resolve(b), 'image/png');
    });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export default function AutoServerIconBootstrap() {
    const uuid = ServerContext.useStoreState((s) => s.server.data?.uuid);

    useEffect(() => {
        if (!uuid) return;
        const flagKey = `aq.server-icon-checked.${uuid}`;
        if (sessionStorage.getItem(flagKey)) return;

        let cancelled = false;
        (async () => {
            try {
                const files = await loadDirectory(uuid, '/');
                if (cancelled) return;
                const exists = files.some((f) => f.isFile && f.name === 'server-icon.png');
                sessionStorage.setItem(flagKey, '1');
                if (exists) return;

                const blob = await drawAquiaLogo();
                if (!blob || cancelled) return;

                const url = await getFileUploadUrl(uuid);
                const form = new FormData();
                form.append('files', blob, 'server-icon.png');
                await fetch(`${url}&directory=/`, { method: 'POST', body: form });
            } catch {
                // best-effort: don't block UI, allow retry on next session
                sessionStorage.removeItem(flagKey);
            }
        })();

        return () => { cancelled = true; };
    }, [uuid]);

    return null;
}
