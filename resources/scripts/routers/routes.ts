import React, { lazy } from 'react';
import ServerConsole from '@/components/server/console/ServerConsoleContainer';
import DatabasesContainer from '@/components/server/databases/DatabasesContainer';
import ScheduleContainer from '@/components/server/schedules/ScheduleContainer';
import UsersContainer from '@/components/server/users/UsersContainer';
import BackupContainer from '@/components/server/backups/BackupContainer';
import NetworkContainer from '@/components/server/network/NetworkContainer';
import StartupContainer from '@/components/server/startup/StartupContainer';
import FileManagerContainer from '@/components/server/files/FileManagerContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';
import AccountOverviewContainer from '@/components/dashboard/AccountOverviewContainer';
import AccountApiContainer from '@/components/dashboard/AccountApiContainer';
import AccountSSHContainer from '@/components/dashboard/ssh/AccountSSHContainer';
import ActivityLogContainer from '@/components/dashboard/activity/ActivityLogContainer';
import ServerActivityLogContainer from '@/components/server/ServerActivityLogContainer';
import {
    TerminalIcon,
    FolderIcon,
    DatabaseIcon,
    ArchiveIcon,
    PuzzleIcon,
    RefreshIcon,
    AdjustmentsIcon,
    ChatAlt2Icon,
    CalendarIcon,
    CogIcon,
    UsersIcon,
    ClipboardListIcon,
    UserCircleIcon,
    ShieldCheckIcon,
    KeyIcon,
    CodeIcon,
    PhotographIcon,
    ServerIcon,
} from '@heroicons/react/outline';

// Each of the router files is already code split out appropriately — so
// all of the items above will only be loaded in when that router is loaded.
//
// These specific lazy loaded routes are to avoid loading in heavy screens
// for the server dashboard when they're only needed for specific instances.
const FileEditContainer = lazy(() => import('@/components/server/files/FileEditContainer'));
const ScheduleEditContainer = lazy(() => import('@/components/server/schedules/ScheduleEditContainer'));
const PluginsContainer = lazy(() => import('@/components/server/plugins/PluginsContainer'));
const VersionChangerContainer = lazy(() => import('@/components/server/tools/VersionChangerContainer'));
const PropertiesContainer = lazy(() => import('@/components/server/tools/PropertiesContainer'));
const MotdContainer = lazy(() => import('@/components/server/tools/MotdContainer'));
const ServerIconContainer = lazy(() => import('@/components/server/tools/ServerIconContainer'));
const PlayerListContainer = lazy(() => import('@/components/server/tools/PlayerListContainer'));
const PlayerManagerContainer = lazy(() => import('@/components/server/tools/PlayerManagerContainer'));

interface RouteDefinition {
    path: string;
    // If undefined is passed this route is still rendered into the router itself
    // but no navigation link is displayed in the sub-navigation menu.
    name: string | undefined;
    component: React.ComponentType;
    exact?: boolean;
    iconProp?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface ServerRouteDefinition extends RouteDefinition {
    permission: string | string[] | null;
    section?: string;
}

interface Routes {
    // All of the routes available under "/account"
    account: RouteDefinition[];
    // All of the routes available under "/server/:id"
    server: ServerRouteDefinition[];
}

export default {
    account: [
        {
            path: '/',
            name: 'Account',
            component: AccountOverviewContainer,
            exact: true,
            iconProp: UserCircleIcon,
        },
        {
            path: '/api',
            name: 'API Credentials',
            component: AccountApiContainer,
            iconProp: CodeIcon,
        },
        {
            path: '/ssh',
            name: 'SSH Keys',
            component: AccountSSHContainer,
            iconProp: KeyIcon,
        },
        {
            path: '/activity',
            name: 'Activity',
            component: ActivityLogContainer,
            iconProp: ClipboardListIcon,
        },
    ],
    server: [
        {
            path: '/',
            permission: null,
            name: 'Console',
            section: 'GENERAL',
            component: ServerConsole,
            exact: true,
            iconProp: TerminalIcon,
        },
        {
            path: '/files',
            permission: 'file.*',
            name: 'Files',
            section: 'MANAGEMENT',
            component: FileManagerContainer,
            iconProp: FolderIcon,
        },
        {
            path: '/files/:action(edit|new)',
            permission: 'file.*',
            name: undefined,
            component: FileEditContainer,
            iconProp: CodeIcon,
        },
        {
            path: '/databases',
            permission: 'database.*',
            name: 'Databases',
            section: 'MANAGEMENT',
            component: DatabasesContainer,
            iconProp: DatabaseIcon,
        },
        {
            path: '/backups',
            permission: 'backup.*',
            name: 'Backups',
            section: 'MANAGEMENT',
            component: BackupContainer,
            iconProp: ArchiveIcon,
        },
        {
            path: '/network',
            permission: 'allocation.*',
            name: undefined,
            component: NetworkContainer,
        },
        {
            path: '/plugins',
            permission: null,
            name: 'Plugins',
            section: 'MANAGEMENT',
            component: PluginsContainer,
            iconProp: PuzzleIcon,
        },
        {
            path: '/version',
            permission: 'startup.*',
            name: 'Version Changer',
            section: 'CONFIGURATION',
            component: VersionChangerContainer,
            iconProp: RefreshIcon,
        },
        {
            path: '/properties',
            permission: 'file.*',
            name: 'Properties',
            section: 'CONFIGURATION',
            component: PropertiesContainer,
            iconProp: AdjustmentsIcon,
        },
        {
            path: '/motd',
            permission: 'file.*',
            name: 'MOTD Maker',
            section: 'CONFIGURATION',
            component: MotdContainer,
            iconProp: ChatAlt2Icon,
        },
        {
            path: '/icon',
            permission: 'file.*',
            name: undefined,
            component: ServerIconContainer,
        },
        {
            path: '/schedules',
            permission: 'schedule.*',
            name: 'Schedules',
            section: 'CONFIGURATION',
            component: ScheduleContainer,
            iconProp: CalendarIcon,
        },
        {
            path: '/schedules/:id',
            permission: 'schedule.*',
            name: undefined,
            component: ScheduleEditContainer,
            iconProp: CalendarIcon,
        },
        {
            path: '/users',
            permission: 'user.*',
            name: undefined,
            component: UsersContainer,
        },
        {
            path: '/startup',
            permission: 'startup.*',
            name: undefined,
            component: StartupContainer,
        },
        {
            path: '/settings',
            permission: ['settings.*', 'file.sftp'],
            name: 'Settings',
            section: 'CONFIGURATION',
            component: SettingsContainer,
            iconProp: CogIcon,
        },
        {
            path: '/players',
            permission: 'file.*',
            name: 'Player Manager',
            section: 'CONFIGURATION',
            component: PlayerManagerContainer,
            iconProp: UsersIcon,
        },
        {
            path: '/activity',
            permission: 'activity.*',
            name: 'Activity',
            section: 'CONFIGURATION',
            component: ServerActivityLogContainer,
            iconProp: ClipboardListIcon,
        },
    ],
} as Routes;
