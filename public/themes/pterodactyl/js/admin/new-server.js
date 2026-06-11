// Copyright (c) 2015 - 2017 Dane Everitt <dane@daneeveritt.com>
// MIT License — see original header for full text.

// ─── LOADER CONFIGURATION ────────────────────────────────────────────────────
// Each entry defines how a server type is recognized, displayed, and what
// version API to call when populating the version picker dropdown.
const LOADER_CONFIGS = [
    {
        id: 'paper',
        pattern: /\bpaper\b/i,
        name: 'Paper',
        description: 'High-performance Bukkit fork',
        logo: 'https://avatars.githubusercontent.com/u/7779991?s=64',
        color: '#4496f0',
        versionEnvVars: ['MC_VERSION', 'SERVER_VERSION', 'MINECRAFT_VERSION'],
        fetchVersions: () =>
            fetch('https://api.papermc.io/v2/projects/paper')
                .then(r => r.json())
                .then(d => d.versions.slice().reverse()),
    },
    {
        id: 'fabric',
        pattern: /\bfabric\b/i,
        name: 'Fabric',
        description: 'Lightweight modding toolchain',
        logo: 'https://avatars.githubusercontent.com/u/54829053?s=64',
        color: '#c8a96a',
        versionEnvVars: ['MC_VERSION', 'GAME_VERSION', 'MINECRAFT_VERSION'],
        fetchVersions: () =>
            fetch('https://meta.fabricmc.net/v2/versions/game')
                .then(r => r.json())
                .then(d => d.filter(v => v.stable).map(v => v.version)),
    },
    {
        id: 'purpur',
        pattern: /\bpurpur\b/i,
        name: 'Purpur',
        description: 'Feature-rich Paper fork',
        logo: 'https://avatars.githubusercontent.com/u/86699148?s=64',
        color: '#a855f7',
        versionEnvVars: ['MC_VERSION', 'SERVER_VERSION', 'MINECRAFT_VERSION'],
        fetchVersions: () =>
            fetch('https://api.purpurmc.org/v2/purpur')
                .then(r => r.json())
                .then(d => d.versions.slice().reverse()),
    },
    {
        id: 'quilt',
        pattern: /\bquilt\b/i,
        name: 'Quilt',
        description: 'Community-driven Fabric fork',
        logo: 'https://avatars.githubusercontent.com/u/81144032?s=64',
        color: '#9c27b0',
        versionEnvVars: ['MC_VERSION', 'GAME_VERSION', 'MINECRAFT_VERSION'],
        fetchVersions: () =>
            fetch('https://meta.quiltmc.org/v3/versions/game')
                .then(r => r.json())
                .then(d => d.map(v => v.version))
                .catch(() =>
                    fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
                        .then(r => r.json())
                        .then(d => d.versions.filter(v => v.type === 'release').map(v => v.id))
                ),
    },
    {
        id: 'neoforge',
        pattern: /neo.?forge/i,
        name: 'NeoForge',
        description: 'Modern Forge continuation',
        logo: 'https://avatars.githubusercontent.com/u/133710068?s=64',
        color: '#e65100',
        versionEnvVars: ['MC_VERSION', 'MINECRAFT_VERSION'],
        fetchVersions: () =>
            fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
                .then(r => r.json())
                .then(d => d.versions.filter(v => v.type === 'release').map(v => v.id)),
    },
    {
        id: 'forge',
        pattern: /\bforge\b/i,
        name: 'Forge',
        description: 'The original mod loader',
        logo: 'https://avatars.githubusercontent.com/u/1390178?s=64',
        color: '#c0824c',
        versionEnvVars: ['MC_VERSION', 'MINECRAFT_VERSION', 'FORGE_VERSION'],
        fetchVersions: () =>
            fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
                .then(r => r.json())
                .then(d => d.versions.filter(v => v.type === 'release').map(v => v.id)),
    },
    {
        id: 'vanilla',
        pattern: /\bvanilla\b/i,
        name: 'Vanilla',
        description: 'Official Mojang server',
        logo: 'https://avatars.githubusercontent.com/u/4233345?s=64',
        color: '#43a047',
        versionEnvVars: ['MC_VERSION', 'SERVER_VERSION', 'MINECRAFT_VERSION'],
        fetchVersions: () =>
            fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
                .then(r => r.json())
                .then(d => d.versions.filter(v => v.type === 'release').map(v => v.id)),
    },
    {
        id: 'spigot',
        pattern: /\bspigot\b/i,
        name: 'Spigot',
        description: 'Popular CraftBukkit fork',
        logo: 'https://avatars.githubusercontent.com/u/2748476?s=64',
        color: '#ff9800',
        versionEnvVars: ['MC_VERSION', 'SERVER_VERSION', 'MINECRAFT_VERSION'],
        fetchVersions: () =>
            fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
                .then(r => r.json())
                .then(d => d.versions.filter(v => v.type === 'release').map(v => v.id)),
    },
    {
        id: 'bukkit',
        pattern: /\b(bukkit|craftbukkit)\b/i,
        name: 'CraftBukkit',
        description: 'The original modded server',
        logo: 'https://avatars.githubusercontent.com/u/2748476?s=64',
        color: '#795548',
        versionEnvVars: ['MC_VERSION', 'SERVER_VERSION', 'MINECRAFT_VERSION'],
        fetchVersions: () =>
            fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
                .then(r => r.json())
                .then(d => d.versions.filter(v => v.type === 'release').map(v => v.id)),
    },
    {
        id: 'velocity',
        pattern: /\bvelocity\b/i,
        name: 'Velocity',
        description: 'Modern high-perf proxy',
        logo: 'https://avatars.githubusercontent.com/u/7779991?s=64',
        color: '#1565c0',
        versionEnvVars: [],
        fetchVersions: () =>
            fetch('https://api.papermc.io/v2/projects/velocity')
                .then(r => r.json())
                .then(d => d.versions.slice().reverse()),
    },
    {
        id: 'waterfall',
        pattern: /\bwaterfall\b/i,
        name: 'Waterfall',
        description: 'Enhanced BungeeCord fork',
        logo: 'https://avatars.githubusercontent.com/u/7779991?s=64',
        color: '#0097a7',
        versionEnvVars: [],
        fetchVersions: () =>
            fetch('https://api.papermc.io/v2/projects/waterfall')
                .then(r => r.json())
                .then(d => d.versions.slice().reverse()),
    },
    {
        id: 'bungeecord',
        pattern: /\bbungee(cord)?\b/i,
        name: 'BungeeCord',
        description: 'Classic Minecraft proxy',
        logo: 'https://avatars.githubusercontent.com/u/2748476?s=64',
        color: '#607d8b',
        versionEnvVars: [],
        fetchVersions: null,
    },
];

// Currently selected loader (set when user clicks a card or changes egg manually)
let currentLoaderConfig = null;

// ─── VISUAL LOADER PICKER ────────────────────────────────────────────────────
function buildServerTypePicker() {
    if (typeof Pterodactyl === 'undefined' || !Pterodactyl.nests) return;

    const $grid = $('#loaderPickerGrid');

    // Collect all eggs across nests, find which have matching loader configs
    const found = [];
    const seenConfigIds = new Set();

    $.each(Pterodactyl.nests, function (nestId, nest) {
        $.each(nest.eggs, function (eggId, egg) {
            const config = LOADER_CONFIGS.find(c => c.pattern.test(egg.name));
            if (config && !seenConfigIds.has(config.id)) {
                seenConfigIds.add(config.id);
                found.push({ nestId, eggId, egg, config });
            }
        });
    });

    $grid.empty();

    if (found.length === 0) {
        $grid.html('<p class="text-muted small"><i class="fa fa-info-circle"></i>&nbsp;No recognized server types found in this panel. Use the Nest Configuration section below.</p>');
        return;
    }

    found.forEach(({ nestId, eggId, egg, config }) => {
        const logoHtml = config.logo
            ? `<img src="${escapeHtml(config.logo)}" alt="${escapeHtml(config.name)}" onerror="this.style.display='none'">`
            : `<span style="font-size:26px;">🎮</span>`;

        const $card = $(`
            <div class="loader-card" data-nest-id="${escapeHtml(String(nestId))}" data-egg-id="${escapeHtml(String(eggId))}"
                 data-config-id="${escapeHtml(config.id)}" title="${escapeHtml(config.description)}">
                <div class="lc-logo">${logoHtml}</div>
                <div class="lc-name">${escapeHtml(config.name)}</div>
                <div class="lc-desc">${escapeHtml(config.description)}</div>
            </div>
        `);

        $card.on('mouseenter', function () {
            if (!$(this).hasClass('selected')) {
                $(this).css({ borderColor: config.color, transform: 'translateY(-3px)', boxShadow: '0 6px 16px rgba(0,0,0,.12)' });
            }
        }).on('mouseleave', function () {
            if (!$(this).hasClass('selected')) {
                $(this).css({ borderColor: '#ddd', transform: '', boxShadow: '' });
            }
        });

        $card.on('click', function () {
            // Deselect all
            $('.loader-card').removeClass('selected').css({ borderColor: '#ddd', transform: '', boxShadow: '', background: '#fff', color: '' });

            // Select this card
            $(this).addClass('selected').css({
                borderColor: config.color,
                background: hexToRgba(config.color, 0.07),
                boxShadow: `0 0 0 3px ${hexToRgba(config.color, 0.25)}`,
                transform: '',
            });

            currentLoaderConfig = config;

            // Scroll to Nest Configuration box so the user can see it update
            const nestTop = $('#pNestId').closest('.box').offset().top - 20;

            // Auto-select the nest and egg
            $('#pNestId').val(nestId).trigger('change');
            setTimeout(() => {
                $('#pEggId').val(eggId).trigger('change');
            }, 150);
        });

        $grid.append($card);
    });
}

// ─── VERSION VARIABLE ENHANCER ───────────────────────────────────────────────
// After an egg is selected, scan the rendered service variables and replace
// plain text inputs that look like version fields with populated <select> dropdowns.
function enhanceVersionVariables() {
    // If no loader was chosen via the card picker, try to detect from egg name
    if (!currentLoaderConfig) {
        const nestId = $('#pNestId').val();
        const eggId  = $('#pEggId').val();
        const egg    = _.get(Pterodactyl.nests, nestId + '.eggs.' + eggId, null);
        if (egg) {
            currentLoaderConfig = LOADER_CONFIGS.find(c => c.pattern.test(egg.name)) || null;
        }
    }

    if (!currentLoaderConfig || !currentLoaderConfig.fetchVersions) return;

    const config = currentLoaderConfig;

    $('#appendVariablesTo input[type="text"]').each(function () {
        const $input  = $(this);
        const rawName = ($input.attr('name') || '');
        // Extract env var name from  environment[MC_VERSION]
        const envVar  = rawName.replace(/^environment\[/, '').replace(/\]$/, '');

        const isVersionVar = config.versionEnvVars.includes(envVar)
            || /version|mc_ver/i.test(envVar);

        if (!isVersionVar) return;
        if ($input.closest('.form-group').find('.version-select').length) return; // already replaced

        const savedVal  = $input.val();
        const inputId   = $input.attr('id');
        const inputName = $input.attr('name');

        // Build a select in place of the input
        const $select = $('<select></select>')
            .attr('id', inputId)
            .attr('name', inputName)
            .addClass('form-control version-select');

        $select.append('<option value="" disabled selected>⏳ Fetching versions from ' + escapeHtml(config.name) + ' API…</option>');
        $input.replaceWith($select);
        $select.select2({ placeholder: 'Select a version…', width: '100%' });

        // Fetch versions and populate
        config.fetchVersions()
            .then(versions => {
                $select.empty();
                $select.append('<option value="">— Select a version —</option>');
                versions.forEach(v => {
                    const $opt = $('<option></option>').val(v).text(v);
                    if (v === savedVal) $opt.prop('selected', true);
                    $select.append($opt);
                });
                // If no previous value, default to first (most recent) version
                if (!savedVal && versions.length > 0) {
                    $select.val(versions[0]);
                }
                $select.select2({ placeholder: 'Select a version…', width: '100%' }).trigger('change.select2');

                // Add a small badge to show this was auto-populated
                const $label = $select.closest('.form-group').find('label');
                if (!$label.find('.version-badge').length) {
                    $label.append(
                        `<span class="version-badge label label-info" title="Versions fetched from ${escapeHtml(config.name)} API">
                            <i class="fa fa-cloud-download"></i> Live versions
                        </span>`
                    );
                }
            })
            .catch(err => {
                console.error('[WiskCraft] Failed to fetch versions for ' + config.name + ':', err);
                // Gracefully restore the text input
                const $restored = $('<input type="text"></input>')
                    .attr('id', inputId)
                    .attr('name', inputName)
                    .addClass('form-control')
                    .val(savedVal)
                    .attr('placeholder', 'Enter version manually');
                $select.replaceWith($restored);

                const $label = $restored.closest('.form-group').find('label');
                if (!$label.find('.version-badge-error').length) {
                    $label.append('<span class="version-badge-error label label-warning" title="Could not reach the API"><i class="fa fa-exclamation-triangle"></i> Enter manually</span>');
                }
            });
    });
}

// ─── UTILITY ─────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ─── INITIALISATION ──────────────────────────────────────────────────────────
$(document).ready(function () {
    $('#pNestId').select2({ placeholder: 'Select a Nest' }).change();
    $('#pEggId').select2({ placeholder: 'Select a Nest Egg' });
    $('#pPackId').select2({ placeholder: 'Select a Service Pack' });
    $('#pNodeId').select2({ placeholder: 'Select a Node' }).change();
    $('#pAllocation').select2({ placeholder: 'Select a Default Allocation' });
    $('#pAllocationAdditional').select2({ placeholder: 'Select Additional Allocations' });
});

// Highlight active box on click
let lastActiveBox = null;
$(document).on('click', function (event) {
    if (lastActiveBox !== null) lastActiveBox.removeClass('box-primary');
    lastActiveBox = $(event.target).closest('.box');
    lastActiveBox.addClass('box-primary');
});

// ─── NODE / ALLOCATION HANDLERS ──────────────────────────────────────────────
$('#pNodeId').on('change', function () {
    const currentNode = $(this).val();
    $.each(Pterodactyl.nodeData, function (i, v) {
        if (v.id == currentNode) {
            $('#pAllocation').html('').select2({
                data: v.allocations,
                placeholder: 'Select a Default Allocation',
            });
            updateAdditionalAllocations();
        }
    });
});

$('#pAllocation').on('change', function () {
    updateAdditionalAllocations();
});

function updateAdditionalAllocations() {
    const currentAllocation = $('#pAllocation').val();
    const currentNode = $('#pNodeId').val();

    $.each(Pterodactyl.nodeData, function (i, v) {
        if (v.id == currentNode) {
            const allocations = v.allocations.filter(a => a.id != currentAllocation);
            $('#pAllocationAdditional').html('').select2({
                data: allocations,
                placeholder: 'Select Additional Allocations',
            });
        }
    });
}

// ─── NEST / EGG HANDLERS ─────────────────────────────────────────────────────
$('#pNestId').on('change', function () {
    $('#pEggId').html('').select2({
        data: $.map(_.get(Pterodactyl.nests, $(this).val() + '.eggs', []), function (item) {
            return { id: item.id, text: item.name };
        }),
    }).change();
});

$('#pEggId').on('change', function () {
    const parentChain = _.get(Pterodactyl.nests, $('#pNestId').val(), null);
    const objectChain = _.get(parentChain, 'eggs.' + $(this).val(), null);

    // Docker images
    const images = _.get(objectChain, 'docker_images', {});
    $('#pDefaultContainer').html('');
    Object.keys(images).forEach(key => {
        const opt = document.createElement('option');
        opt.value = images[key];
        opt.innerText = key + ' (' + images[key] + ')';
        $('#pDefaultContainer').append(opt);
    });

    // Startup command
    if (!_.get(objectChain, 'startup', false)) {
        $('#pStartup').val(_.get(parentChain, 'startup', 'ERROR: Startup Not Defined!'));
    } else {
        $('#pStartup').val(_.get(objectChain, 'startup'));
    }

    // Packs
    $('#pPackId').html('').select2({
        data: [{ id: 0, text: 'No Service Pack' }].concat(
            $.map(_.get(objectChain, 'packs', []), function (item) {
                return { id: item.id, text: item.name + ' (' + item.version + ')' };
            })
        ),
    });

    // Service variables
    const variableIds = {};
    $('#appendVariablesTo').html('');
    $.each(_.get(objectChain, 'variables', []), function (i, item) {
        variableIds[item.env_variable] = 'var_ref_' + item.id;

        const isRequired = (item.required === 1)
            ? '<span class="label label-danger">Required</span> '
            : '';

        const dataAppend = `
            <div class="form-group col-sm-6">
                <label for="var_ref_${escapeHtml(String(item.id))}" class="control-label">
                    ${isRequired}${escapeHtml(item.name)}
                </label>
                <input type="text"
                       id="var_ref_${escapeHtml(String(item.id))}"
                       autocomplete="off"
                       name="environment[${escapeHtml(item.env_variable)}]"
                       class="form-control"
                       value="${escapeHtml(item.default_value)}" />
                <p class="text-muted small">
                    ${escapeHtml(item.description)}<br>
                    <strong>Access in Startup:</strong> <code>{{${escapeHtml(item.env_variable)}}}</code><br>
                    <strong>Validation Rules:</strong> <code>${escapeHtml(item.rules)}</code>
                </p>
            </div>
        `;
        $('#appendVariablesTo').append(dataAppend);
    });

    // If egg was changed without the card picker, reset loader detection
    if (!currentLoaderConfig) {
        const eggName = _.get(objectChain, 'name', '');
        currentLoaderConfig = LOADER_CONFIGS.find(c => c.pattern.test(eggName)) || null;

        // Highlight matching card if one exists
        if (currentLoaderConfig) {
            const configId = currentLoaderConfig.id;
            $('.loader-card').removeClass('selected').css({ borderColor: '#ddd', transform: '', boxShadow: '', background: '#fff' });
            const $matchCard = $('.loader-card[data-config-id="' + configId + '"]');
            if ($matchCard.length) {
                $matchCard.addClass('selected').css({
                    borderColor: currentLoaderConfig.color,
                    background: hexToRgba(currentLoaderConfig.color, 0.07),
                    boxShadow: '0 0 0 3px ' + hexToRgba(currentLoaderConfig.color, 0.25),
                });
            }
        }
    }

    // Replace version text inputs with populated dropdowns (slight delay so DOM settles)
    setTimeout(enhanceVersionVariables, 80);

    // Callback for blade-side persistence of old values
    serviceVariablesUpdated($('#pEggId').val(), variableIds);
});

// ─── USER SELECT ─────────────────────────────────────────────────────────────
function initUserIdSelect(data) {
    $('#pUserId').select2({
        ajax: {
            url: '/admin/users/accounts.json',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return { filter: { email: params.term }, page: params.page };
            },
            processResults: function (data) {
                return { results: data };
            },
            cache: true,
        },
        data: data,
        escapeMarkup: function (markup) { return markup; },
        minimumInputLength: 2,
        templateResult: function (data) {
            if (data.loading) return escapeHtml(data.text);
            return `<div class="user-block">
                <img class="img-circle img-bordered-xs" src="https://www.gravatar.com/avatar/${escapeHtml(data.md5)}?s=120" alt="User Image">
                <span class="username"><a href="#">${escapeHtml(data.name_first)} ${escapeHtml(data.name_last)}</a></span>
                <span class="description"><strong>${escapeHtml(data.email)}</strong> - ${escapeHtml(data.username)}</span>
            </div>`;
        },
        templateSelection: function (data) {
            return `<div>
                <span><img class="img-rounded img-bordered-xs" src="https://www.gravatar.com/avatar/${escapeHtml(data.md5)}?s=120" style="height:28px;margin-top:-4px;" alt="User Image"></span>
                <span style="padding-left:5px;">${escapeHtml(data.name_first)} ${escapeHtml(data.name_last)} (<strong>${escapeHtml(data.email)}</strong>)</span>
            </div>`;
        },
    });
}
