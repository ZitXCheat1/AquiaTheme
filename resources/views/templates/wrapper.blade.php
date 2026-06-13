<!DOCTYPE html>
<html>
    <head>
        <title>{{ config('app.name', 'Pterodactyl') }}</title>

        @section('meta')
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
            <meta name="csrf-token" content="{{ csrf_token() }}">
            <meta name="robots" content="noindex">
            <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg">
            <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32">
            <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16">
            <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
            <link rel="manifest" href="/favicons/manifest.json">
            <link rel="mask-icon" href="/favicons/favicon.svg" color="#08cd00">
            <link rel="shortcut icon" href="/favicons/favicon.svg">
            <meta name="msapplication-config" content="/favicons/browserconfig.xml">
            <meta name="theme-color" content="#08cd00">
        @show

        @section('user-data')
            @if(!is_null(Auth::user()))
                <script>
                    window.PterodactylUser = {!! json_encode(Auth::user()->toVueObject()) !!};
                </script>
            @endif
            @if(!empty($siteConfiguration))
                <script>
                    window.SiteConfiguration = {!! json_encode($siteConfiguration) !!};
                </script>
            @endif
        @show

        @yield('assets')

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">

        <style>
            .xterm,
            .xterm *,
            .xterm-rows,
            .xterm-rows *,
            .xterm-screen,
            .xterm-screen * {
                letter-spacing: 0 !important;
                font-variant-ligatures: none !important;
                font-family: "JetBrains Mono", "Cascadia Mono", Consolas, "Courier New", monospace !important;
            }
        </style>

        @include('layouts.scripts')
    </head>
    <body class="{{ $css['body'] ?? 'bg-neutral-50' }}">
        @section('content')
            @yield('above-container')
            @yield('container')
            @yield('below-container')
        @show
        @section('scripts')
            {!! $asset->js('main.js') !!}
        @show
    </body>
</html>
