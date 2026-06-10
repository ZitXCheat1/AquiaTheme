<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>{{ config('app.name', 'Aquia Panel') }} &mdash; @yield('title')</title>
        <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
        <meta name="_token" content="{{ csrf_token() }}">

        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
        <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32">
        <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16">
        <link rel="manifest" href="/favicons/manifest.json">
        <link rel="shortcut icon" href="/favicons/favicon.ico">
        <meta name="theme-color" content="#00d4ff">

        @include('layouts.scripts')

        @section('scripts')
            {!! Theme::css('vendor/select2/select2.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/bootstrap/bootstrap.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/adminlte/admin.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/adminlte/colors/skin-blue.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/sweetalert/sweetalert.min.css?t={cache-version}') !!}
            {!! Theme::css('vendor/animate/animate.min.css?t={cache-version}') !!}
            {!! Theme::css('css/pterodactyl.css?t={cache-version}') !!}

            {{-- Font Awesome 6 Free --}}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

            {{-- Google Fonts: Inter --}}
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">

            <style>
                body, .skin-blue .sidebar-menu > li > a, .box-header .box-title,
                .content-header > h1, .main-footer { font-family: 'Inter', system-ui, sans-serif !important; }
            </style>
        @show
    </head>

    <body class="hold-transition skin-blue fixed sidebar-mini">
        <div class="wrapper">

            {{-- ─────── TOP NAVBAR ─────── --}}
            <header class="main-header">
                <a href="{{ route('index') }}" class="logo">
                    <span class="logo-mini">
                        <i class="fa-solid fa-droplet" style="color:#00d4ff"></i>
                    </span>
                    <span class="logo-lg">
                        <i class="fa-solid fa-droplet" style="color:#00d4ff; margin-right:7px;"></i>
                        <strong>{{ config('app.name', 'Aquia Panel') }}</strong>
                    </span>
                </a>

                <nav class="navbar navbar-static-top">
                    <a href="#" class="sidebar-toggle" data-toggle="push-menu" role="button">
                        <span class="sr-only">Toggle navigation</span>
                        <i class="fa-solid fa-bars"></i>
                    </a>

                    <div class="navbar-custom-menu">
                        <ul class="nav navbar-nav">
                            {{-- Version badge --}}
                            <li class="hidden-xs">
                                <a href="#" style="cursor:default; pointer-events:none; opacity:0.6;">
                                    <small>
                                        <i class="fa-solid fa-code-branch" style="color:#00d4ff; margin-right:4px;"></i>
                                        v{{ config('app.fork-version', '1.0') }}
                                    </small>
                                </a>
                            </li>

                            {{-- User menu --}}
                            <li class="dropdown user user-menu">
                                <a href="{{ route('account') }}" class="dropdown-toggle" style="display:flex; align-items:center; gap:8px;">
                                    <img src="https://www.gravatar.com/avatar/{{ md5(strtolower(Auth::user()->email)) }}?s=160"
                                         class="user-image" alt="Avatar"
                                         style="width:28px; height:28px; border-radius:50%; border:2px solid rgba(0,212,255,0.3);">
                                    <span class="hidden-xs" style="font-size:0.85rem;">{{ Auth::user()->name_first }}</span>
                                </a>
                            </li>

                            {{-- Exit admin --}}
                            <li>
                                <a href="{{ route('index') }}"
                                   data-toggle="tooltip" data-placement="bottom" title="Exit to Panel"
                                   style="transition:color 0.2s;">
                                    <i class="fa-solid fa-server" style="font-size:1rem;"></i>
                                </a>
                            </li>

                            {{-- Logout --}}
                            <li>
                                <a href="{{ route('auth.logout') }}"
                                   id="logoutButton"
                                   data-toggle="tooltip" data-placement="bottom" title="Sign Out"
                                   style="transition:color 0.2s;">
                                    <i class="fa-solid fa-right-from-bracket" style="font-size:1rem;"></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
            </header>

            {{-- ─────── SIDEBAR ─────── --}}
            <aside class="main-sidebar">
                <section class="sidebar">

                    {{-- User panel --}}
                    <div class="user-panel" style="padding:12px 16px; display:flex; align-items:center; gap:10px; border-bottom:1px solid rgba(0,212,255,0.08); margin-bottom:8px;">
                        <img src="https://www.gravatar.com/avatar/{{ md5(strtolower(Auth::user()->email)) }}?s=160"
                             style="width:38px; height:38px; border-radius:50%; border:2px solid rgba(0,212,255,0.25);" alt="avatar">
                        <div>
                            <p style="margin:0; font-size:0.82rem; font-weight:600; color:#cbd5e1;">
                                {{ Auth::user()->name_first }} {{ Auth::user()->name_last }}
                            </p>
                            <p style="margin:0; font-size:0.72rem; color:#475569;">
                                <i class="fa-solid fa-circle" style="color:#22c55e; font-size:0.5rem; vertical-align:middle; animation:aqPulse 2s ease-in-out infinite;"></i>
                                Administrator
                            </p>
                        </div>
                    </div>

                    <ul class="sidebar-menu">
                        {{-- Basic Administration --}}
                        <li class="header">
                            <i class="fa-solid fa-shield-halved" style="margin-right:6px; color:rgba(0,212,255,0.4);"></i>
                            Administration
                        </li>

                        <li class="{{ Route::currentRouteName() !== 'admin.index' ?: 'active' }}">
                            <a href="{{ route('admin.index') }}">
                                <i class="fa fa-fw fa-home"></i>
                                <span>Overview</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.settings') ?: 'active' }}">
                            <a href="{{ route('admin.settings') }}">
                                <i class="fa fa-fw fa-gear"></i>
                                <span>Settings</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.api') ?: 'active' }}">
                            <a href="{{ route('admin.api.index') }}">
                                <i class="fa fa-fw fa-plug"></i>
                                <span>Application API</span>
                            </a>
                        </li>

                        {{-- Management --}}
                        <li class="header">
                            <i class="fa-solid fa-layer-group" style="margin-right:6px; color:rgba(0,212,255,0.4);"></i>
                            Management
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.databases') ?: 'active' }}">
                            <a href="{{ route('admin.databases') }}">
                                <i class="fa fa-fw fa-database"></i>
                                <span>Databases</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.locations') ?: 'active' }}">
                            <a href="{{ route('admin.locations') }}">
                                <i class="fa fa-fw fa-globe"></i>
                                <span>Locations</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.nodes') ?: 'active' }}">
                            <a href="{{ route('admin.nodes') }}">
                                <i class="fa fa-fw fa-sitemap"></i>
                                <span>Nodes</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.servers') ?: 'active' }}">
                            <a href="{{ route('admin.servers') }}">
                                <i class="fa fa-fw fa-server"></i>
                                <span>Servers</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.users') ?: 'active' }}">
                            <a href="{{ route('admin.users') }}">
                                <i class="fa fa-fw fa-users"></i>
                                <span>Users</span>
                            </a>
                        </li>

                        {{-- Service Management --}}
                        <li class="header">
                            <i class="fa-solid fa-cubes" style="margin-right:6px; color:rgba(0,212,255,0.4);"></i>
                            Services
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.mounts') ?: 'active' }}">
                            <a href="{{ route('admin.mounts') }}">
                                <i class="fa fa-fw fa-hard-drive"></i>
                                <span>Mounts</span>
                            </a>
                        </li>

                        <li class="{{ ! starts_with(Route::currentRouteName(), 'admin.nests') ?: 'active' }}">
                            <a href="{{ route('admin.nests') }}">
                                <i class="fa fa-fw fa-th-large"></i>
                                <span>Nests</span>
                            </a>
                        </li>
                    </ul>

                    {{-- Sidebar footer --}}
                    <div style="position:absolute; bottom:0; left:0; right:0; padding:12px 16px; border-top:1px solid rgba(0,212,255,0.08); font-size:0.7rem; color:#334155; text-align:center;">
                        <i class="fa-solid fa-droplet" style="color:rgba(0,212,255,0.3); margin-right:4px;"></i>
                        Aquia Theme v{{ config('app.fork-version', '1.0') }}
                    </div>
                </section>
            </aside>

            {{-- ─────── CONTENT ─────── --}}
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
                                    <i class="fa-solid fa-circle-exclamation" style="margin-right:8px;"></i>
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
                                        @if($type === 'success') <i class="fa-solid fa-circle-check" style="margin-right:6px;"></i>
                                        @elseif($type === 'danger') <i class="fa-solid fa-circle-exclamation" style="margin-right:6px;"></i>
                                        @elseif($type === 'warning') <i class="fa-solid fa-triangle-exclamation" style="margin-right:6px;"></i>
                                        @else <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>
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

            {{-- ─────── FOOTER ─────── --}}
            <footer class="main-footer">
                <div class="pull-right small text-gray" style="margin-right:10px; margin-top:-5px; line-height:1.8;">
                    <span>
                        <i class="fa-solid fa-{{ $appIsGit ? 'code-branch' : 'code-fork' }}" style="color:rgba(0,212,255,0.5);"></i>
                        {{ $appVersion }}
                    </span>
                    &nbsp;&bull;&nbsp;
                    <span>
                        <i class="fa-regular fa-clock" style="color:rgba(0,212,255,0.5);"></i>
                        {{ round(microtime(true) - LARAVEL_START, 3) }}s
                    </span>
                </div>
                <i class="fa-solid fa-droplet" style="color:rgba(0,212,255,0.5); margin-right:5px;"></i>
                Copyright &copy; 2022 &ndash; {{ date('Y') }}
                <a href="https://wiskcraft.com/" style="color:var(--aq-accent);">Aquia Theme</a>.
                &nbsp;&bull;&nbsp;
                <a href="https://pterodactyl.io/" style="color:rgba(0,212,255,0.4); font-size:0.8em;">Pterodactyl</a>
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
                        $(this).css('color', '#00d4ff');
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
