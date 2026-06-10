@extends('layouts.admin')

@section('title')
    Administration
@endsection

@section('content-header')
    <h1>
        <i class="fa-solid fa-gauge-high" style="color:#00d4ff; margin-right:10px;"></i>
        Overview
        <small>A quick glance at your system.</small>
    </h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}"><i class="fa-solid fa-house"></i> Admin</a></li>
        <li class="active">Overview</li>
    </ol>
@endsection

@section('content')

{{-- Version Status --}}
<div class="row">
    <div class="col-xs-12">
        <div class="box {{ $version->isLatestPanel() ? 'box-success' : 'box-danger' }}">
            <div class="box-header with-border">
                <h3 class="box-title">
                    <i class="fa-solid fa-{{ $version->isLatestPanel() ? 'circle-check' : 'triangle-exclamation' }}"
                       style="color:{{ $version->isLatestPanel() ? '#22c55e' : '#ef4444' }}; margin-right:8px;"></i>
                    System Status
                </h3>
            </div>
            <div class="box-body">
                @if ($version->isLatestPanel())
                    <span style="color:#86efac;">
                        <i class="fa-solid fa-circle-check" style="margin-right:6px;"></i>
                        Running <strong>Aquia Theme</strong>
                        <code>{{ config('app.fork-version') }}</code>
                        based on Pterodactyl <code>{{ config('app.version') }}</code>.
                        Your panel is <strong>up-to-date</strong>.
                    </span>
                @else
                    <span style="color:#fca5a5;">
                        <i class="fa-solid fa-triangle-exclamation" style="margin-right:6px;"></i>
                        Your panel is <strong>not up-to-date!</strong>
                        Latest version:
                        <a href="https://github.com/WiskCraft/AquiaTheme/releases/v{{ $version->getPanel() }}" target="_blank">
                            <code>{{ $version->getPanel() }}</code>
                        </a>
                        &mdash; you are on <code>{{ config('app.version') }}</code>.
                    </span>
                @endif
            </div>
        </div>
    </div>
</div>

{{-- Quick-action cards --}}
<div class="row">
    <div class="col-sm-3 col-xs-6">
        <a href="{{ $version->getDiscord() }}" target="_blank" class="small-box-footer" style="text-decoration:none;">
            <div class="small-box bg-yellow" style="background:linear-gradient(135deg,#d97706,#92400e)!important; border-radius:10px;">
                <div class="inner">
                    <h3 style="font-size:1rem; font-weight:700;">Discord</h3>
                    <p>Get support</p>
                </div>
                <div class="icon"><i class="fa-brands fa-discord"></i></div>
                <div class="small-box-footer" style="color:rgba(255,255,255,0.7); padding:6px 12px; display:block;">
                    <i class="fa-solid fa-arrow-right"></i> Join Community
                </div>
            </div>
        </a>
    </div>

    <div class="col-sm-3 col-xs-6">
        <a href="https://pterodactyl.io" target="_blank" style="text-decoration:none;">
            <div class="small-box bg-blue" style="background:linear-gradient(135deg,#1d4ed8,#1e40af)!important; border-radius:10px;">
                <div class="inner">
                    <h3 style="font-size:1rem; font-weight:700;">Docs</h3>
                    <p>Documentation</p>
                </div>
                <div class="icon"><i class="fa-solid fa-book"></i></div>
                <div class="small-box-footer" style="color:rgba(255,255,255,0.7); padding:6px 12px; display:block;">
                    <i class="fa-solid fa-arrow-right"></i> Read the Docs
                </div>
            </div>
        </a>
    </div>

    <div class="col-sm-3 col-xs-6">
        <a href="https://github.com/pterodactyl/panel" target="_blank" style="text-decoration:none;">
            <div class="small-box" style="background:linear-gradient(135deg,#1f2937,#111827)!important; border:1px solid rgba(0,212,255,0.15); border-radius:10px;">
                <div class="inner">
                    <h3 style="font-size:1rem; font-weight:700;">GitHub</h3>
                    <p>Source code</p>
                </div>
                <div class="icon"><i class="fa-brands fa-github"></i></div>
                <div class="small-box-footer" style="color:rgba(255,255,255,0.7); padding:6px 12px; display:block;">
                    <i class="fa-solid fa-arrow-right"></i> View Source
                </div>
            </div>
        </a>
    </div>

    <div class="col-sm-3 col-xs-6">
        <a href="{{ $version->getDonations() }}" target="_blank" style="text-decoration:none;">
            <div class="small-box" style="background:linear-gradient(135deg,#065f46,#064e3b)!important; border-radius:10px;">
                <div class="inner">
                    <h3 style="font-size:1rem; font-weight:700;">Support</h3>
                    <p>Donate</p>
                </div>
                <div class="icon"><i class="fa-solid fa-heart"></i></div>
                <div class="small-box-footer" style="color:rgba(255,255,255,0.7); padding:6px 12px; display:block;">
                    <i class="fa-solid fa-arrow-right"></i> Support the Project
                </div>
            </div>
        </a>
    </div>
</div>

{{-- Info tiles --}}
<div class="row">
    <div class="col-md-4">
        <div class="box box-default">
            <div class="box-header with-border">
                <h3 class="box-title">
                    <i class="fa-solid fa-circle-info" style="color:#3b82f6; margin-right:8px;"></i>
                    Panel Info
                </h3>
            </div>
            <div class="box-body" style="font-size:0.85rem; line-height:2;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,212,255,0.06); padding:4px 0;">
                    <span style="color:#64748b;"><i class="fa-solid fa-droplet" style="margin-right:6px; color:rgba(0,212,255,0.5);"></i>Aquia Theme</span>
                    <code>{{ config('app.fork-version', '—') }}</code>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,212,255,0.06); padding:4px 0;">
                    <span style="color:#64748b;"><i class="fa-brands fa-php" style="margin-right:6px; color:rgba(0,212,255,0.5);"></i>Pterodactyl</span>
                    <code>{{ config('app.version', '—') }}</code>
                </div>
                <div style="display:flex; justify-content:space-between; padding:4px 0;">
                    <span style="color:#64748b;"><i class="fa-solid fa-leaf" style="margin-right:6px; color:rgba(0,212,255,0.5);"></i>PHP</span>
                    <code>{{ phpversion() }}</code>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-8">
        <div class="box box-default">
            <div class="box-header with-border">
                <h3 class="box-title">
                    <i class="fa-solid fa-bolt" style="color:#f59e0b; margin-right:8px;"></i>
                    Quick Navigation
                </h3>
            </div>
            <div class="box-body">
                <div class="row" style="display:flex; flex-wrap:wrap; gap:8px; padding:0 5px;">
                    @foreach([
                        ['icon'=>'server',    'label'=>'Servers',   'route'=>'admin.servers'],
                        ['icon'=>'users',     'label'=>'Users',     'route'=>'admin.users'],
                        ['icon'=>'sitemap',   'label'=>'Nodes',     'route'=>'admin.nodes'],
                        ['icon'=>'globe',     'label'=>'Locations', 'route'=>'admin.locations'],
                        ['icon'=>'database',  'label'=>'Databases', 'route'=>'admin.databases'],
                        ['icon'=>'hard-drive','label'=>'Mounts',    'route'=>'admin.mounts'],
                        ['icon'=>'th-large',  'label'=>'Nests',     'route'=>'admin.nests'],
                        ['icon'=>'gear',      'label'=>'Settings',  'route'=>'admin.settings'],
                    ] as $item)
                    <a href="{{ route($item['route']) }}"
                       style="display:flex; align-items:center; gap:7px; padding:7px 14px;
                              background:rgba(0,212,255,0.05); border:1px solid rgba(0,212,255,0.12);
                              border-radius:8px; color:#cbd5e1; font-size:0.82rem; font-weight:500;
                              text-decoration:none; transition:all 0.2s;"
                       onmouseover="this.style.background='rgba(0,212,255,0.12)'; this.style.color='#00d4ff'; this.style.transform='translateY(-2px)';"
                       onmouseout="this.style.background='rgba(0,212,255,0.05)'; this.style.color='#cbd5e1'; this.style.transform='translateY(0)';">
                        <i class="fa-solid fa-{{ $item['icon'] }}" style="color:rgba(0,212,255,0.6);"></i>
                        {{ $item['label'] }}
                    </a>
                    @endforeach
                </div>
            </div>
        </div>
    </div>
</div>

@endsection
