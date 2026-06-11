<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>{{ config('app.name', 'Aquia Panel') }} &mdash; @yield('title')</title>
        <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
        <meta name="_token" content="{{ csrf_token() }}">

        <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg">
        <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32">
        <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16">
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
        <link rel="manifest" href="/favicons/manifest.json">
        <link rel="shortcut icon" href="/favicons/favicon.svg">
        <meta name="theme-color" content="#08cd00">

        @include('layouts.scripts')

        @section('scripts')
            {!! Theme::css('vendor/select2/select2.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/bootstrap/bootstrap.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/adminlte/admin.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/adminlte/colors/skin-blue.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/sweetalert/sweetalert.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/animate/animate.min.css?t={cache-version}') !!}
            {!! Theme::css('css/pterodactyl.css?t={cache-version}') !!}

            {{-- Google Fonts: Inter + Material Icons --}}
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">

            <style>
                /* â”€â”€â”€ AquiaTheme Admin â€” Green Edition â”€â”€â”€ */
                :root {
                    --aq-accent: #08cd00;
                    --aq-bg: #0a0f0a;
                    --aq-surface: #111611;
                    --aq-surface2: #162016;
                    --aq-border: rgba(8,205,0,0.12);
                    --aq-glow: rgba(8,205,0,0.18);
                }

                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

                body, *:not(.material-icons) { font-family: 'Inter', system-ui, sans-serif !important; }
                .material-icons { font-family: 'Material Icons' !important; font-size: 16px; vertical-align: -3px; line-height: 1; display: inline-block; }
                body { font-size: 17px !important; }
                .content-header > h1 { font-size: 1.9rem !important; font-weight: 700 !important; }
                .content-header > .breadcrumb { font-size: 0.95rem !important; }
                .sidebar-menu > li > a { font-size: 1.08rem !important; padding: 11px 16px !important; }
                .sidebar-menu > li.header { font-size: 0.8rem !important; letter-spacing: 0.08em !important; padding: 12px 16px 6px !important; }
                .box-header .box-title { font-size: 1.2rem !important; font-weight: 600 !important; }
                .table, .table td, .table th { font-size: 1rem !important; }
                label, .control-label { font-size: 1rem !important; font-weight: 500 !important; }
                .form-control, select.form-control { font-size: 1rem !important; padding: 9px 12px !important; height: auto !important; }
                .btn { font-size: 1rem !important; padding: 9px 18px !important; }
                p, .help-block { font-size: 0.96rem !important; }
                .nav-tabs > li > a { font-size: 1.05rem !important; }
                small, .small { font-size: 0.9rem !important; }
                .main-header .logo strong { font-size: 1.18rem !important; }
                .navbar-nav > li > a { font-size: 1rem !important; }
                .user-panel p { font-size: 0.9rem !important; }

                /* Wipe all AdminLTE blue */
                body, .wrapper, .content-wrapper, .main-footer { background: #0a0f0a !important; }

                /* Top navbar */
                .main-header .navbar,
                .main-header .logo {
                    background: rgba(10,15,10,0.96) !important;
                    border-bottom: 1px solid rgba(8,205,0,0.12) !important;
                    backdrop-filter: blur(16px);
                }
                .main-header .logo { border-right: 1px solid rgba(8,205,0,0.1) !important; }
                .main-header .logo:hover { background: rgba(8,205,0,0.04) !important; }
                .skin-blue .main-header .navbar .nav > li > a,
                .skin-blue .main-header .navbar .nav > li > a:hover { color: #94a3b8 !important; }
                .skin-blue .main-header .navbar .nav > li > a:hover { color: #08cd00 !important; }
                .main-header .navbar .nav > li > a { transition: color 0.15s; }
                .main-header .sidebar-toggle { color: #08cd00 !important; }
                .main-header .sidebar-toggle:hover { background: rgba(8,205,0,0.07) !important; }

                /* Sidebar */
                .main-sidebar,
                .skin-blue .main-sidebar { background: #0c110c !important; border-right: 1px solid rgba(8,205,0,0.1) !important; }
                .skin-blue .sidebar-menu > li > a { color: #94a3b8 !important; border-radius: 8px; margin: 1px 6px; transition: all 0.18s; }
                .skin-blue .sidebar-menu > li > a:hover,
                .skin-blue .sidebar-menu > li.active > a { background: rgba(8,205,0,0.08) !important; color: #ffffff !important; }
                .skin-blue .sidebar-menu > li.active > a { border-left: 3px solid #08cd00 !important; }
                .skin-blue .sidebar-menu > li > a > .fa,
                .skin-blue .sidebar-menu > li > a > i { color: #4d7a4d !important; width: 20px; }
                .skin-blue .sidebar-menu > li.active > a > .fa,
                .skin-blue .sidebar-menu > li.active > a > i { color: #08cd00 !important; }
                .skin-blue .treeview-menu > li > a { color: #64748b !important; }
                .skin-blue .treeview-menu > li.active > a { color: #08cd00 !important; }
                .sidebar-menu .header {
                    color: #3d5c3d !important;
                    font-size: 0.6rem !important;
                    letter-spacing: 0.1em !important;
                    text-transform: uppercase !important;
                    font-weight: 700 !important;
                    padding: 14px 16px 5px !important;
                }

                /* Boxes / Cards */
                .box { background: #111611 !important; border: 1px solid rgba(8,205,0,0.1) !important; border-radius: 10px !important; box-shadow: none !important; }
                .box-header { background: transparent !important; border-bottom: 1px solid rgba(8,205,0,0.08) !important; }
                .box-header .box-title { color: #ffffff !important; font-weight: 600 !important; }
                .box-footer { background: transparent !important; border-top: 1px solid rgba(8,205,0,0.08) !important; }
                .box.box-primary { border-top: 2px solid #08cd00 !important; }
                .box.box-success { border-top: 2px solid #4ade80 !important; }
                .box.box-danger  { border-top: 2px solid #ef4444 !important; }
                .box.box-warning { border-top: 2px solid #eab308 !important; }
                .box.box-info    { border-top: 2px solid #3b82f6 !important; }

                /* Tables */
                .table, table { color: #e2e8f0 !important; }
                .table > thead > tr > th { color: #94a3b8 !important; border-bottom: 1px solid rgba(8,205,0,0.1) !important; font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600; }
                .table > tbody > tr > td { border-top: 1px solid rgba(8,205,0,0.06) !important; color: #e2e8f0 !important; }
                .table-hover > tbody > tr:hover { background: rgba(8,205,0,0.04) !important; }
                .table-striped > tbody > tr:nth-of-type(odd) { background: rgba(8,205,0,0.02) !important; }

                /* Forms */
                .form-control {
                    background: #0a0f0a !important;
                    border: 1px solid rgba(8,205,0,0.15) !important;
                    border-radius: 7px !important;
                    color: #ffffff !important;
                    transition: border-color 0.15s !important;
                    box-shadow: none !important;
                }
                .form-control:focus { border-color: rgba(8,205,0,0.4) !important; box-shadow: 0 0 0 3px rgba(8,205,0,0.06) !important; }
                .form-control::placeholder { color: #3d5c3d !important; }
                label { color: #94a3b8 !important; font-weight: 500 !important; font-size: 0.82rem !important; }
                .control-label { color: #ffffff !important; }
                .help-block { color: #64748b !important; font-size: 0.75rem !important; }
                select.form-control option { background: #0a0f0a; color: #ffffff; }

                /* Buttons */
                .btn-primary, .btn-success { background: #08cd00 !important; border-color: #07b300 !important; color: #0a0f0a !important; font-weight: 700 !important; border-radius: 7px !important; }
                .btn-primary:hover, .btn-success:hover { background: #07b300 !important; transform: translateY(-1px); }
                .btn-default { background: #111611 !important; border: 1px solid rgba(8,205,0,0.15) !important; color: #94a3b8 !important; border-radius: 7px !important; }
                .btn-default:hover { border-color: rgba(8,205,0,0.35) !important; color: #fff !important; }
                .btn-danger { background: #ef4444 !important; border-color: #dc2626 !important; color: #fff !important; border-radius: 7px !important; }
                .btn-warning { background: #eab308 !important; border-color: #ca8a04 !important; color: #0a0f0a !important; border-radius: 7px !important; }
                .btn-info    { background: #3b82f6 !important; border-color: #2563eb !important; color: #fff !important; border-radius: 7px !important; }
                .btn { transition: all 0.15s !important; }

                /* Badges / Labels */
                .label-primary, .badge-primary { background: rgba(8,205,0,0.15) !important; color: #08cd00 !important; border: 1px solid rgba(8,205,0,0.2) !important; }
                .label-success { background: rgba(74,222,128,0.12) !important; color: #4ade80 !important; }
                .label-danger  { background: rgba(239,68,68,0.12) !important; color: #ef4444 !important; }
                .label-warning { background: rgba(234,179,8,0.12) !important; color: #eab308 !important; }

                /* Alerts */
                .alert { border-radius: 8px !important; border: none !important; }
                .alert-success { background: rgba(8,205,0,0.09) !important; color: #4ade80 !important; border-left: 3px solid #08cd00 !important; }
                .alert-danger  { background: rgba(239,68,68,0.09) !important; color: #ef4444 !important; border-left: 3px solid #ef4444 !important; }
                .alert-warning { background: rgba(234,179,8,0.09) !important; color: #eab308 !important; border-left: 3px solid #eab308 !important; }
                .alert-info    { background: rgba(59,130,246,0.09) !important; color: #60a5fa !important; border-left: 3px solid #3b82f6 !important; }

                /* Pagination */
                .pagination > li > a { background: #111611 !important; border-color: rgba(8,205,0,0.1) !important; color: #94a3b8 !important; border-radius: 6px !important; margin: 0 2px; }
                .pagination > .active > a { background: #08cd00 !important; border-color: #08cd00 !important; color: #0a0f0a !important; }
                .pagination > li > a:hover { background: rgba(8,205,0,0.08) !important; color: #fff !important; }

                /* Content header */
                .content-header > h1 { color: #ffffff !important; font-weight: 700 !important; font-size: 1.25rem !important; }
                .content-header > .breadcrumb { background: transparent !important; color: #64748b !important; }
                .content-header > .breadcrumb > li.active { color: #08cd00 !important; }

                /* Footer */
                .main-footer { background: #0a0f0a !important; border-top: 1px solid rgba(8,205,0,0.08) !important; color: #3d5c3d !important; }
                .main-footer a { color: #08cd00 !important; }

                /* Scrollbar */
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(8,205,0,0.2); border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(8,205,0,0.4); }

                /* Select2 */
                .select2-container--default .select2-selection--single,
                .select2-container--default .select2-selection--multiple {
                    background: #0a0f0a !important;
                    border: 1px solid rgba(8,205,0,0.15) !important;
                    border-radius: 7px !important;
                    color: #fff !important;
                }
                .select2-dropdown { background: #111611 !important; border: 1px solid rgba(8,205,0,0.2) !important; border-radius: 8px !important; }
                .select2-results__option { color: #e2e8f0 !important; }
                .select2-results__option--highlighted { background: rgba(8,205,0,0.1) !important; color: #ffffff !important; }
                .select2-container--default .select2-selection--single .select2-selection__rendered { color: #ffffff !important; }
                .select2-search--dropdown .select2-search__field { background: #0a0f0a !important; border: 1px solid rgba(8,205,0,0.2) !important; color: #fff !important; border-radius: 5px !important; }

                /* Nav tabs */
                .nav-tabs { border-bottom: 1px solid rgba(8,205,0,0.1) !important; }
                .nav-tabs > li > a { color: #64748b !important; border: none !important; border-radius: 6px 6px 0 0 !important; transition: all 0.15s; }
                .nav-tabs > li > a:hover { background: rgba(8,205,0,0.05) !important; color: #94a3b8 !important; }
                .nav-tabs > li.active > a { background: rgba(8,205,0,0.1) !important; color: #08cd00 !important; border-bottom: 2px solid #08cd00 !important; }
                .tab-content { padding-top: 16px !important; }

                /* Misc */
                .user-panel { border-bottom: 1px solid rgba(8,205,0,0.08) !important; }
                @keyframes aqFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
                @keyframes aqPulse { 0%,100% { opacity:0.7; transform:scale(1); } 50% { opacity:1; transform:scale(1.3); } }
                .content .box { animation: aqFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
            </style>
        @show
    </head>

    <body class="hold-transition skin-blue fixed sidebar-mini">
        <div class="wrapper">

            {{-- â”€â”€â”€â”€â”€â”€â”€ TOP NAVBAR â”€â”€â”€â”€â”€â”€â”€ --}}
            <header class="main-header">
                <a href="{{ route('index') }}" class="logo">
                    <span class="logo-mini">
                        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="5" width="28" height="9" rx="2.5" fill="rgba(8,205,0,0.15)" stroke="#08cd00" stroke-width="1"/>
                            <rect x="4" y="7.5" width="12" height="4" rx="1" fill="rgba(8,205,0,0.2)"/>
                            <circle cx="22" cy="9.5" r="2" fill="#08cd00"/>
                            <circle cx="26.5" cy="9.5" r="2" fill="#08cd00" opacity="0.4"/>
                            <rect x="2" y="17" width="28" height="9" rx="2.5" fill="rgba(8,205,0,0.15)" stroke="#08cd00" stroke-width="1"/>
                            <rect x="4" y="19.5" width="12" height="4" rx="1" fill="rgba(8,205,0,0.2)"/>
                            <circle cx="22" cy="21.5" r="2" fill="#08cd00" opacity="0.5"/>
                            <circle cx="26.5" cy="21.5" r="2" fill="#08cd00"/>
                        </svg>
                    </span>
                    <span class="logo-lg">
                        <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; margin-right:8px;">
                            <rect x="2" y="5" width="28" height="9" rx="2.5" fill="rgba(8,205,0,0.15)" stroke="#08cd00" stroke-width="1"/>
                            <rect x="4" y="7.5" width="12" height="4" rx="1" fill="rgba(8,205,0,0.2)"/>
                            <circle cx="22" cy="9.5" r="2" fill="#08cd00"/>
                            <circle cx="26.5" cy="9.5" r="2" fill="#08cd00" opacity="0.4"/>
                            <rect x="2" y="17" width="28" height="9" rx="2.5" fill="rgba(8,205,0,0.15)" stroke="#08cd00" stroke-width="1"/>
                            <rect x="4" y="19.5" width="12" height="4" rx="1" fill="rgba(8,205,0,0.2)"/>
                            <circle cx="22" cy="21.5" r="2" fill="#08cd00" opacity="0.5"/>
                            <circle cx="26.5" cy="21.5" r="2" fill="#08cd00"/>
                        </svg><strong style="font-size:1.15rem; letter-spacing:-0.02em; color:#ffffff;">Aquia<span style="color:#08cd00;">Theme</span></strong>
                    </span>
                </a>

                <nav class="navbar navbar-static-top">
                    <a href="#" class="sidebar-toggle" data-toggle="push-menu" role="button">
                        <span class="sr-only">Toggle navigation</span>
                        <span class="material-icons">menu</span>
                    </a>

                    <div class="navbar-custom-menu">
                        <ul class="nav navbar-nav">
                            {{-- Version badge --}}
                            <li class="hidden-xs">
                                <a href="#" style="cursor:default; pointer-events:none; opacity:0.6;">
                                    <small>
                                        <span class="material-icons" style="color:#08cd00; margin-right:4px; font-size:13px;">call_split</span>
                                        v{{ config('app.fork-version', '1.0') }}
                                    </small>
                                </a>
                            </li>

                            {{-- User menu --}}
                            <li class="dropdown user user-menu">
                                <a href="{{ route('account') }}" class="dropdown-toggle" style="display:flex; align-items:center; gap:8px;">
                                    <img src="https://www.gravatar.com/avatar/{{ md5(strtolower(Auth::user()->email)) }}?s=160"
                                         class="user-image" alt="Avatar"
                                         style="width:28px; height:28px; border-radius:50%; border:2px solid rgba(8,205,0,0.3);">
                                    <span class="hidden-xs" style="font-size:0.85rem;">{{ Auth::user()->name_first }}</span>
                                </a>
                            </li>

                            {{-- Exit admin --}}
                            <li>
                                <a href="{{ route('index') }}"
                                   data-toggle="tooltip" data-placement="bottom" title="Exit to Panel"
                                   style="transition:color 0.2s;">
                                    <span class="material-icons" style="font-size:1rem;">dns</span>
                                </a>
                            </li>

                            {{-- Logout --}}
                            <li>
                                <a href="{{ route('auth.logout') }}"
                                   id="logoutButton"
                                   data-toggle="tooltip" data-placement="bottom" title="Sign Out"
                                   style="transition:color 0.2s;">
                                    <span class="material-icons" style="font-size:1rem;">logout</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
            </header>

            {{-- â”€â”€â”€â”€â”€â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€ --}}
            <aside class="main-sidebar">
                <section class="sidebar">

                    {{-- User panel --}}
                    <div class="user-panel" style="padding:12px 16px; display:flex; align-items:center; gap:10px; border-bottom:1px solid rgba(8,205,0,0.08); margin-bottom:8px;">
                        <img src="https://www.gravatar.com/avatar/{{ md5(strtolower(Auth::user()->email)) }}?s=160"
                             style="width:38px; height:38px; border-radius:50%; border:2px solid rgba(8,205,0,0.25);" alt="avatar">
                        <div>
                            <p style="margin:0; font-size:0.82rem; font-weight:600; color:#cbd5e1;">
                                {{ Auth::user()->name_first }} {{ Auth::user()->name_last }}
                            </p>
                            <p style="margin:0; font-size:0.72rem; color:#475569;">
                                <span class="material-icons" style="color:#22c55e; font-size:8px; vertical-align:middle; animation:aqPulse 2s ease-in-out infinite;">circle</span>
                                Administrator
                            </p>
                        </div>
                    </div>

                    <ul class="sidebar-menu">
                        {{-- Basic Administration --}}
                        <li class="header">
                            <span class="material-icons" style="margin-right:6px; color:rgba(8,205,0,0.4); font-size:13px;">security</span>
                            Administration
                        </li>

                        <li class="{{ Route::currentRouteName() !== 'admin.index' ?: 'active' }}">
                            <a href="{{ route('admin.index') }}">
                                <span class="material-icons">home</span>
                                <span>Overview</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.settings') ?: 'active' }}">
                            <a href="{{ route('admin.settings') }}">
                                <span class="material-icons">settings</span>
                                <span>Settings</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.api') ?: 'active' }}">
                            <a href="{{ route('admin.api.index') }}">
                                <span class="material-icons">power</span>
                                <span>Application API</span>
                            </a>
                        </li>

                        {{-- Management --}}
                        <li class="header">
                            <span class="material-icons" style="margin-right:6px; color:rgba(8,205,0,0.4); font-size:13px;">manage_accounts</span>
                            Management
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.databases') ?: 'active' }}">
                            <a href="{{ route('admin.databases') }}">
                                <span class="material-icons">storage</span>
                                <span>Databases</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.locations') ?: 'active' }}">
                            <a href="{{ route('admin.locations') }}">
                                <span class="material-icons">language</span>
                                <span>Locations</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.nodes') ?: 'active' }}">
                            <a href="{{ route('admin.nodes') }}">
                                <span class="material-icons">account_tree</span>
                                <span>Nodes</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.servers') ?: 'active' }}">
                            <a href="{{ route('admin.servers') }}">
                                <span class="material-icons">dns</span>
                                <span>Servers</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.users') ?: 'active' }}">
                            <a href="{{ route('admin.users') }}">
                                <span class="material-icons">group</span>
                                <span>Users</span>
                            </a>
                        </li>

                        {{-- Service Management --}}
                        <li class="header">
                            <span class="material-icons" style="margin-right:6px; color:rgba(8,205,0,0.4); font-size:13px;">widgets</span>
                            Services
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.mounts') ?: 'active' }}">
                            <a href="{{ route('admin.mounts') }}">
                                <span class="material-icons">hard_drive</span>
                                <span>Mounts</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.nests') ?: 'active' }}">
                            <a href="{{ route('admin.nests') }}">
                                <span class="material-icons">apps</span>
                                <span>Nests</span>
                            </a>
                        </li>
                    </ul>

                    {{-- Sidebar footer --}}
                    <div style="position:absolute; bottom:0; left:0; right:0; padding:14px 16px; border-top:1px solid rgba(8,205,0,0.08); background:rgba(8,205,0,0.02);">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="5" width="28" height="9" rx="2" fill="rgba(8,205,0,0.15)" stroke="#08cd00" stroke-width="1"/>
                                <circle cx="24" cy="9.5" r="1.8" fill="#08cd00"/>
                                <rect x="2" y="17" width="28" height="9" rx="2" fill="rgba(8,205,0,0.15)" stroke="#08cd00" stroke-width="1"/>
                                <circle cx="24" cy="21.5" r="1.8" fill="#08cd00" opacity="0.5"/>
                            </svg>
                            <span style="font-size:0.82rem; font-weight:600; color:#94a3b8;">AquiaTheme</span>
                            <span style="margin-left:auto; font-size:0.7rem; background:rgba(8,205,0,0.12); color:#08cd00; border-radius:4px; padding:1px 6px; font-weight:600;">v{{ config('app.fork-version', '1.0') }}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="width:6px; height:6px; border-radius:50%; background:#22c55e; display:inline-block; box-shadow:0 0 6px #22c55e;"></span>
                            <span style="font-size:0.72rem; color:#475569;">Panel Online</span>
                            <span style="margin-left:auto; font-size:0.72rem; color:#334155;">Pterodactyl {{ $appVersion }}</span>
                        </div>
                    </div>
                </section>
            </aside>

            {{-- â”€â”€â”€â”€â”€â”€â”€ CONTENT â”€â”€â”€â”€â”€â”€â”€ --}}
            <div class="content-wrapper">
                <section class="content-header">
                    @yield('content-header')
                </section>

                <section class="content">
                    {{-- Flash alerts --}}
                    <div class="row">
                        <div class="col-xs-12">
                            @if (count($errors) > 0)
                                <div class="alert alert-danger" style="animation: aqFadeUp 0.3s ease both;">
                                    <span class="material-icons" style="margin-right:8px;">error</span>
                                    There was an error validating the data provided.
                                    <ul style="margin-top:8px; margin-bottom:0;">
                                        @foreach ($errors->all() as $error)
                                            <li>{{ $error }}</li>
                                        @endforeach
                                    </ul>
                                </div>
                            @endif

                            @foreach (Alert::getMessages() as $type => $messages)
                                @foreach ($messages as $message)
                                    <div class="alert alert-{{ $type }} alert-dismissable" role="alert"
                                         style="animation: aqFadeUp 0.3s ease both;">
                                        @if($type === 'success') <span class="material-icons" style="margin-right:6px;">check_circle</span>
                                        @elseif($type === 'danger') <span class="material-icons" style="margin-right:6px;">error</span>
                                        @elseif($type === 'warning') <span class="material-icons" style="margin-right:6px;">warning</span>
                                        @else <span class="material-icons" style="margin-right:6px;">info</span>
                                        @endif
                                        {{ $message }}
                                        <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                                    </div>
                                @endforeach
                            @endforeach
                        </div>
                    </div>

                    @yield('content')
                </section>
            </div>

            {{-- â”€â”€â”€â”€â”€â”€â”€ FOOTER â”€â”€â”€â”€â”€â”€â”€ --}}
            <footer class="main-footer">
                <div class="pull-right small text-gray" style="margin-right:10px; margin-top:-5px; line-height:1.8;">
                    <span>
                        <span class="material-icons" style="color:rgba(8,205,0,0.5); font-size:13px;">call_split</span>
                        {{ $appVersion }}
                    </span>
                    &nbsp;&bull;&nbsp;
                    <span>
                        <span class="material-icons" style="color:rgba(8,205,0,0.5); font-size:13px;">schedule</span>
                        {{ round(microtime(true) - LARAVEL_START, 3) }}s
                    </span>
                </div>
                <span class="material-icons" style="color:rgba(8,205,0,0.5); margin-right:5px; font-size:13px;">water_drop</span>
                Copyright &copy; 2022 &ndash; {{ date('Y') }}
                <a href="https://wiskcraft.com/" style="color:var(--aq-accent);">Aquia Theme</a>.
                &nbsp;&bull;&nbsp;
                <a href="https://pterodactyl.io/" style="color:rgba(8,205,0,0.4); font-size:0.8em;">Pterodactyl</a>
            </footer>
        </div>

        @section('footer-scripts')
            <script src="/js/keyboard.polyfill.js" type="application/javascript"></script>
            <script>keyboardeventKeyPolyfill.polyfill();</script>

            {!! Theme::js('vendor/jquery/jquery.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/sweetalert/sweetalert.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/bootstrap/bootstrap.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/slimscroll/jquery.slimscroll.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/adminlte/app.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/bootstrap-notify/bootstrap-notify.min.js?t={cache-version}') !!}
            {!! Theme::js('vendor/select2/select2.full.min.js?t={cache-version}') !!}
            {!! Theme::js('js/admin/functions.js?t={cache-version}') !!}
            <script src="/js/autocomplete.js" type="application/javascript"></script>

            <script>
                $(function () {
                    $('[data-toggle="tooltip"]').tooltip();

                    /* Stagger-animate each sidebar item on page load */
                    $('.sidebar-menu > li').each(function(i) {
                        var $el = $(this);
                        $el.css({ opacity: 0, transform: 'translateX(-14px)' });
                        setTimeout(function() {
                            $el.css({
                                transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1)',
                                opacity: 1,
                                transform: 'translateX(0)'
                            });
                        }, i * 45);
                    });

                    /* Stagger-animate content boxes */
                    $('.content .box').each(function(i) {
                        var $el = $(this);
                        $el.css({ opacity: 0, transform: 'translateY(14px)' });
                        setTimeout(function() {
                            $el.css({
                                transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                                opacity: 1,
                                transform: 'translateY(0)'
                            });
                        }, 80 + i * 70);
                    });

                    /* Hover ripple on nav buttons */
                    $('.main-header .nav > li > a').on('mouseenter', function() {
                        $(this).css('color', '#08cd00');
                    }).on('mouseleave', function() {
                        $(this).css('color', '');
                    });
                });
            </script>

            @if(Auth::user()->root_admin)
            <script>
                $('#logoutButton').on('click', function(event) {
                    event.preventDefault();
                    swal({
                        title: 'Sign Out?',
                        text: 'You will be returned to the login screen.',
                        type: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#ef4444',
                        cancelButtonColor: '#334155',
                        confirmButtonText: 'Sign Out'
                    }, function() {
                        $.ajax({
                            type: 'POST',
                            url: '{{ route('auth.logout') }}',
                            data: { _token: '{{ csrf_token() }}' },
                            complete: function() {
                                window.location.href = '{{ route('auth.login') }}';
                            }
                        });
                    });
                });
            </script>
            @endif
        @show
    </body>
</html>

