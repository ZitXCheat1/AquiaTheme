import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileArchive, faFileImport, faFolder } from '@fortawesome/free-solid-svg-icons';
import { encodePathSegments } from '@/helpers';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import React, { memo } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import { NavLink, useRouteMatch } from 'react-router-dom';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'pathe';
import { bytesToString } from '@/lib/formatters';
import styles from './style.module.css';

const Clickable: React.FC<{ file: FileObject }> = memo(({ file, children }) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const match = useRouteMatch();

    return (file.isFile && (!file.isEditable() || !canReadContents)) || (!file.isFile && !canRead) ? (
        <div className={styles.details}>{children}</div>
    ) : (
        <NavLink
            className={styles.details}
            to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}
        >
            {children}
        </NavLink>
    );
}, isEqual);

/* AquiaTheme server rack icon as data URI for server-icon.png preview */
const AQUIA_ICON = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0a0f0a"/><rect x="8" y="14" width="48" height="14" rx="3" fill="#111611" stroke="#08cd00" stroke-width="1.2"/><rect x="8" y="33" width="48" height="14" rx="3" fill="#111611" stroke="#08cd00" stroke-width="1.2"/><rect x="12" y="18" width="22" height="6" rx="1.5" fill="#1a2a1a"/><rect x="12" y="37" width="22" height="6" rx="1.5" fill="#1a2a1a"/><circle cx="40" cy="21" r="2.5" fill="#08cd00"/><circle cx="46" cy="21" r="2.5" fill="#08cd00" opacity="0.4"/><circle cx="40" cy="40" r="2.5" fill="#08cd00" opacity="0.7"/><circle cx="46" cy="40" r="2.5" fill="#08cd00"/></svg>`)}`;

const FileObjectRow = ({ file }: { file: FileObject }) => (
    <div
        className={`${styles.file_row} aq-file-row`}
        key={file.name}
        onContextMenu={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
        }}
    >
        <SelectFileCheckbox name={file.name} />
        <Clickable file={file}>
            <div css={tw`flex-none text-neutral-400 ml-6 mr-4 text-lg pl-3`} style={{ display: 'flex', alignItems: 'center' }}>
                {file.isFile && file.name === 'server-icon.png' ? (
                    <img src={AQUIA_ICON} alt='server-icon' className='aq-file-icon-preview'/>
                ) : file.isFile ? (
                    <FontAwesomeIcon
                        icon={file.isSymlink ? faFileImport : file.isArchiveType() ? faFileArchive : faFileAlt}
                    />
                ) : (
                    <FontAwesomeIcon icon={faFolder} />
                )}
            </div>
            <div css={tw`flex-1 truncate`}>{file.name}</div>
            {file.isFile && <div css={tw`w-1/6 text-right mr-4 hidden sm:block`}>{bytesToString(file.size)}</div>}
            <div css={tw`w-1/5 text-right mr-4 hidden md:block`} title={file.modifiedAt.toString()}>
                {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                    ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                    : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
            </div>
        </Clickable>
        <FileDropdownMenu file={file} />
    </div>
);

export default memo(FileObjectRow, (prevProps, nextProps) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile);
});
