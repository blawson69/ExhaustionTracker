/*
ExhaustionTracker
Changes and maintains character exhaustion levels on the Roll20 5e Shaped Sheet.

On Github:	https://github.com/blawson69
Contact me: https://app.roll20.net/users/1781274/ben-l

Like this script? Become a patron:
    https://www.patreon.com/benscripts
*/

var ExhaustionTracker = ExhaustionTracker || (function () {
    'use strict';

    //---- INFO ----//

    var version = '0.5.1',
    debugMode = false,
    MARKERS,
    ALT_MARKERS = [{name:'red', tag: 'red', url:"#C91010"}, {name: 'blue', tag: 'blue', url: "#1076C9"}, {name: 'green', tag: 'green', url: "#2FC910"}, {name: 'brown', tag: 'brown', url: "#C97310"}, {name: 'purple', tag: 'purple', url: "#9510C9"}, {name: 'pink', tag: 'pink', url: "#EB75E1"}, {name: 'yellow', tag: 'yellow', url: "#E5EB75"}, {name: 'dead', tag: 'dead', url: "X"}],
    styles = {
        box:  'background-color: #fff; border: 1px solid #000; padding: 8px 10px; border-radius: 6px; margin-left: -40px; margin-right: 0px;',
        button: 'background-color: #000; border-width: 0px; border-radius: 5px; padding: 5px 8px; color: #fff; text-align: center;',
        buttonWrapper: 'text-align: center; margin: 10px 0; clear: both;',
        textButton: 'background-color: transparent; border: none; padding: 0; color: #8e342a; text-decoration: underline;',
        code: 'font-family: "Courier New", Courier, monospace; background-color: #ddd; color: #000; padding: 2px 4px;',
        alert: 'color: #C91010; font-size: 1.5em; font-weight: bold; font-variant: small-caps; text-align: center;'
    },
    exhaustion_levels = [{level: 1, desc: "You have Disadvantage on ability checks."}, {level: 2, desc: "Your Speed is halved."}, {level: 3, desc: "You have Disadvantage on attack rolls and saving throws."}, {level: 4, desc: "Your Hit point maximum halved."}, {level: 5, desc: "Your Speed is reduced to 0."}, {level: 6, desc: "You are Dead!"}],

    checkInstall = function () {
        if (!_.has(state, 'ExhaustionTracker')) state['ExhaustionTracker'] = state['ExhaustionTracker'] || {};
        if (typeof state['ExhaustionTracker'].exhaustedMarker == 'undefined') state['ExhaustionTracker'].exhaustedMarker = 'half-haze';
        if (typeof state['ExhaustionTracker'].allowPlayerUse == 'undefined') state['ExhaustionTracker'].allowPlayerUse = false;
        log('--> ExhaustionTracker v' + version + ' <-- Initialized');
        MARKERS = JSON.parse(Campaign().get("token_markers"));
        if (debugMode) showAdminDialog('Debug Mode', 'ExhaustionTracker has loaded...');
    },

    //----- INPUT HANDLER -----//

    handleInput = function (msg) {
        if (msg.type == 'api' && msg.content.startsWith('!exhausted')) {
            var parms = msg.content.split(/\s+/i);
            if (parms[0] == '!exhausted+') setLevel(msg, 'up');
            if (parms[0] == '!exhausted-') setLevel(msg, 'dn');

            if (parms[1]) {
                switch (parms[1]) {
                    case 'show':
                        showLevel(msg.selected, msg);
                        break;
                    case 'update':
                        updateTokens(msg.selected, msg);
                        break;
                    case 'set-marker':
                        if (playerIsGM(msg.playerid)) setMarker(msg, msg.content.split(/\s+/i).pop().toLowerCase());
                        break;
                    case 'markers':
                        if (playerIsGM(msg.playerid)) showMarkers();
                        break;
                    case 'toggle-players':
                        if (playerIsGM(msg.playerid)) togglePlayers(msg);
                        break;
                    case 'config':
                        if (playerIsGM(msg.playerid)) showConfig();
                        break;
                    case 'help':
                    default:
                        showHelp(msg);
                        break;
                }
            }
		}
    },

    //---- PRIVATE FUNCTIONS ----//

    showHelp = function (msg) {
        var marker_style = 'margin: 5px 10px 0 0; display: block; float: left;';
        var message = '<span style=\'' + styles.code + '\'>!exhausted help</span><br>Sends this dialog to the chat window.<br><br>'
        + '<span style=\'' + styles.code + '\'>!exhausted show</span><br>Displays the Exhaustion Level for the selected character along with the accumulated effects.<br><br>';

        if (state['ExhaustionTracker'].allowPlayerUse || playerIsGM(msg.playerid)) {
            message += '<span style=\'' + styles.code + '\'>!exhausted+</span><br>Increases the selected character\'s Exhaustion Level by one, sets the appropriate Exhaustion Marker on the token, and displays the effects of the new Level.<br><br>'
            + '<span style=\'' + styles.code + '\'>!exhausted-</span><br>Decreases the selected character\'s Exhaustion Level by one, sets the appropriate Exhaustion Marker on the token, and displays the effects of the new Level.<br><br>';
        }

        var curr_marker = _.find(MARKERS, function (x) { return x.tag == state['ExhaustionTracker'].exhaustedMarker; });
        if (typeof curr_marker == 'undefined') curr_marker = _.find(ALT_MARKERS, function (x) { return x.tag == state['ExhaustionTracker'].exhaustedMarker; });
        message += '<h4>Exhaustion Marker</h4>' + getMarker(curr_marker.tag, marker_style)
        + 'This is the current status marker to indicate Exhaustion. A number will appear on it to indicate the character\'s Exhaustion Level.<br>';

        if (playerIsGM(msg.playerid)) {
            message += '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!exhausted config">Config Menu</a></div>';
            showAdminDialog('Help Menu', message);
        } else showDialog('Help Menu', message, msg.who, true);
    },

    showConfig = function (msg) {
        var marker_style = 'margin: 5px 10px 0 0; display: block; float: left;';
        var message = '<h4>Player Use</h4>';
        if (state['ExhaustionTracker'].allowPlayerUse) {
            message += 'You are currently configured to allow players to use ExhaustionTracker to adjust their own Exhaustion Levels.<br><div style="'
            + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!exhausted toggle-players">Disable</a></div><br>';
        } else {
            message += 'Players are not currently allowed to change their Exhaustion Levels, which is the default setting. However, you may want to enable this if they '
            + 'have macros they need to run in conjunction with other abilities. If this is the case, you may set ExhaustionTracker to allow users to this functionality.'
            + '<br><div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!exhausted toggle-players">Enable</a></div><br>';
        }

        var curr_marker = _.find(MARKERS, function (x) { return x.tag == state['ExhaustionTracker'].exhaustedMarker; });
        if (typeof curr_marker == 'undefined') curr_marker = _.find(ALT_MARKERS, function (x) { return x.tag == state['ExhaustionTracker'].exhaustedMarker; });
        message += '<h4>Exhaustion Marker</h4>' + getMarker(curr_marker.tag, marker_style)
        + '"' + curr_marker.name + '" is the current status marker being used to indicate Exhaustion.'
        + '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!exhausted markers" title="This may result in a very long list...">Choose Marker</a></div>'
        + '<div style="text-align: center;"><a style="' + styles.textButton + '" href="!exhausted set-marker &#63;&#123;Status Marker&#124;&#125;">Set manually</a></div>';

        showAdminDialog('Config Menu', message);
    },

    togglePlayers = function (msg) {
        state['ExhaustionTracker'].allowPlayerUse = !state['ExhaustionTracker'].allowPlayerUse;
        showConfig(msg);
    },

    setMarker = function (msg, marker) {
        marker = marker.replace('=', '::');
        var status_markers = _.pluck(MARKERS, 'tag');
        _.each(_.pluck(ALT_MARKERS, 'tag'), function (x) { status_markers.push(x); });
        if (_.find(status_markers, function (tmp) {return tmp === marker; })) {
            state['ExhaustionTracker'].exhaustedMarker = marker;
        } else {
            showAdminDialog('Error', 'The status marker "' + marker + '" is invalid. Please try again.');
        }
        showConfig(msg);
    },

    showDialog = function (title, content, character = '', silent = false) {
		// Outputs a 5e Shaped dialog box to players/characters
        var prefix = '', char_name = '';
        if (silent && character.length != 0) prefix = '/w "' + character + '" ';
        if (character.length != 0) char_name = ' {{show_character_name=1}} {{character_name=' + character + '}}';
        var message = prefix + '&{template:5e-shaped} {{title=' + title + '}} {{text_big=' + content + '}}' + char_name;
        sendChat('ExhaustionTracker', message, null, {noarchive:true});
	},

    showAdminDialog = function (title, content, character = '') {
		// Whispers a 5e Shaped dialog box to the GM
        if (character != '') character = ' {{show_character_name=1}} {{character_name=' + character + '}}';
        var message = '/w GM &{template:5e-shaped} {{title=' + title + '}} {{text_big=' + content + '}}' + character;
        sendChat('ExhaustionTracker', message, null, {noarchive:true});
	},

    showMarkers = function () {
        var message = '<table style="border: 0; width: 100%;" cellpadding="0" cellspacing="2">';
        _.each(ALT_MARKERS, function (marker) {
            message += '<tr><td>' + getMarker(marker.tag, 'margin-right: 10px;') + '</td><td style="white-space: nowrap; width: 100%;">' + marker.name + '</td>';
            if (marker == state['ExhaustionTracker'].exhaustedMarker) {
                message += '<td style="text-align: center;">Current</td>';
            } else {
                message += '<td style="text-align: center; white-space: nowrap; padding: 7px;"><a style="' + styles.button + '" href="!exhausted set-marker ' + marker.tag + '">Set Marker</a></td>';
            }
            message += '</tr>';
        });

        _.each(MARKERS, function (icon) {
            message += '<tr><td>' + getMarker(icon.tag, 'margin-right: 10px;') + '</td><td style="white-space: nowrap; width: 100%;">' + icon.name + '</td>';
            if (icon.tag == state['ExhaustionTracker'].exhaustedMarker) {
                message += '<td style="text-align: center;">Current</td>';
            } else {
                message += '<td style="text-align: center; white-space: nowrap; padding: 7px;"><a style="' + styles.button + '" href="!exhausted set-marker ' + icon.tag.replace('::','=') + '">Set Marker</a></td>';
            }
            message += '</tr>';
        });

        message += '<tr><td colspan="3" style="text-align: center; padding: 7px;"><a style="' + styles.button + '" href="!exhausted config">&#9668; Back</a></td></tr>';
        message += '</table>';
        showAdminDialog('Choose Exhaustion Marker', message);
    },

    getMarker = function (marker, style = '') {
        var return_marker = '',
        marker_style = 'width: 24px; height: 24px;' + style,
        status_markers = _.pluck(MARKERS, 'tag'),
        alt_marker = _.find(ALT_MARKERS, function (x) { return x.tag == marker; });

        if (_.find(status_markers, function (x) { return x == marker; })) {
            var icon = _.find(MARKERS, function (x) { return x.tag == marker; });
            return_marker = '<img src="' + icon.url + '" width="24" height="24" style="' + marker_style + '" />';
        } else if (typeof alt_marker !== 'undefined') {
            if (alt_marker.url === 'X') {
                marker_style += 'color: #C91010; font-size: 30px; line-height: 24px; font-weight: bold; text-align: center; padding-top: 0px; overflow: hidden;';
                return_marker = '<div style="' + marker_style + '">X</div>';
            } else {
                marker_style += 'background-color: ' + alt_marker.url + '; border: 1px solid #fff; border-radius: 50%;';
                return_marker = '<div style="' + marker_style + '"></div>';
            }
        } else {
            return false;
        }
        return return_marker;
    },

    setLevel = function(msg, direction) {
        if (state['ExhaustionTracker'].allowPlayerUse || playerIsGM(msg.playerid)) {
            if (msg.selected) {
                _.each(msg.selected, function(obj) {
                    var token = getObj(obj._type, obj._id);
                    if (token && token.get('represents') !== '') {
                        var character = getObj('character', token.get('represents'));
                        var level = findObjs({ type: 'attribute', characterid: character.get('id'), name: 'exhaustion_level' })[0];
                        if (level) {
                            // Change exhaustion level on character sheet
                            var currLevel = parseInt(level.get('current')), newLevel;
                            if (direction == 'up') newLevel = (currLevel < 6) ? currLevel + 1 : 6;
                            else newLevel = (currLevel > 0) ? currLevel - 1 : 0;
                            level.set('current', newLevel);

                            // Set status marker indicating exhaustion level for all character's tokens
                            var char_tokens = findObjs({ represents: character.get('id') });
                            _.each(char_tokens, function(char_token) {
                                if (newLevel == 0) char_token.set('status_' + state['ExhaustionTracker'].exhaustedMarker, false);
                                else char_token.set('status_' + state['ExhaustionTracker'].exhaustedMarker, newLevel);
                            });

                            // Display new exhaustion level
                            showLevel([{_id: token.get('id'), _type: 'graphic'}], msg);
                        }
                    }
                });
            } else {
                if (playerIsGM(msg.playerid)) showAdminDialog('Error', 'You must select some character tokens first!');
                else showDialog('Error', 'You must select some character tokens first!', msg.who, true);
            }
        } else {
            var err_text = 'You do not have permission to use ExhaustionTracker to change your Exhaustion Level.<br><br>Please talk to your GM if you wish to use this functionality.';
            showDialog('Access Denied', err_text, msg.who, true);
        }
    },

    showLevel = function (tokens, msg) {
        // Updates tokens based on the character sheet and sends an explanation of the current exhaustion level
        if (tokens) {
            var regex = /\-\-silent/i;
            _.each(tokens, function(obj) {
                var token = getObj(obj._type, obj._id);
                if (token && token.get('represents') !== '') {
                    var char = getObj('character', token.get('represents'));
                    if (char) {
                        var message, level = getExhaustionLevel(char.get('id'));
                        // Make sure the status marker is set with the appropriate level
                        token.set('status_' + state['ExhaustionTracker'].exhaustedMarker, (level == 0 ? false : level) );

                        if (level == 0) {
                            message = 'You are currently not Exhausted.';
                        } else {
                            message = 'You are now at <b>Exhaustion Level ' + level + ':</b>';
                            if (level == 6) {
                                let dead = _.filter(exhaustion_levels, function(item) { return item.level == 6; })[0];
                                message += '<div style="' + styles.alert + '">' + dead.desc + '</div>';
                            } else {
                                message += '<ul>';
                                var effects = _.filter(exhaustion_levels, function(item) { return item.level <= level; });
                                _.each(effects, function(item) {
                                    message += '<li>' + item.desc + '</li>';
                                });
                                message += '</ul>';
                            }
                        }
                        // Skip dialog if intended to be silent
                        if (!regex.test(msg.content)) showDialog('Exhaustion Level', message, char.get('name'), false);
                    }
                }
            });
        } else {
            if (playerIsGM(msg.playerid)) showAdminDialog('Error', 'You must select some character tokens first.');
            else showDialog('Error', 'You must select some character tokens first.', msg.who, true);
        }
    },

    updateTokens = function(tokens, msg) {
        // Updates tokens based on the character sheet without sending a dialog to chat
        setTimeout(function () {
            msg.content += ' --silent';
            showLevel(tokens, msg);
        }, 500);
    },

    getExhaustionLevel = function(char_id) {
        var result = 0, char = getObj('character', char_id);
        if (char) {
            var level = findObjs({ type: 'attribute', characterid: char_id, name: 'exhaustion_level' })[0];
            if (level) result = parseInt(level.get('current'));
            else level = createObj("attribute", {characterid: char.get('id'), name: "exhaustion_level", current: 0});
        }
        return result;
    },

    handleExhaustionChange = function (obj, prev) {
        if (obj.get('name') == 'exhaustion_level') {
            var page_token_id = '', tokens = findObjs({ represents: obj.get('characterid') });
            if (tokens) {
                var level = getExhaustionLevel(obj.get('characterid'));
                var char = getObj('character', obj.get('characterid'));
                _.each(tokens, function(token) {
                    if (level == 0) token.set('status_' + state['ExhaustionTracker'].exhaustedMarker, false);
                    else token.set('status_' + state['ExhaustionTracker'].exhaustedMarker, level);
                    if (token.get('pageid') == Campaign().get("playerpageid")) page_token_id = token.get('id');
                });
                showLevel([{_id: page_token_id, _type: 'graphic'}], { who: char.get('name'), playerid: char.get('controlledby').split(',')[0] });
            }
        }
    },

    handleTokenDrop = function (obj, prev) {
        if (obj.get('represents') && obj.get('represents') != '' && obj.get('represents') != 'undefined') {
            var token = getObj('graphic', obj.get('id'));
            if (token) {
                var level = getExhaustionLevel(obj.get('represents'));
                token.set('status_' + state['ExhaustionTracker'].exhaustedMarker, (level == 0 ? false : level) );
            }
        }
    },

    //---- PUBLIC FUNCTIONS ----//

    registerEventHandlers = function () {
		on('chat:message', handleInput);
        on('change:attribute', handleExhaustionChange);
        on('add:graphic', handleTokenDrop);
	};

    return {
		checkInstall: checkInstall,
		registerEventHandlers: registerEventHandlers
	};
}());

on("ready", function () {
    ExhaustionTracker.checkInstall();
    ExhaustionTracker.registerEventHandlers();
});
