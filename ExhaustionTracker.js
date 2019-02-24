/*
ExhaustionTracker
Removes tokens marked "dead" from the Turn Tracker

On Github:	https://github.com/blawson69
Contact me: https://app.roll20.net/users/1781274/ben-l
Like this script? Buy me a coffee: https://venmo.com/theBenLawson
*/

var ExhaustionTracker = ExhaustionTracker || (function () {
    'use strict';

    //---- INFO ----//

    var version = '0.1',
    debugMode = false,
    styles = {
        box:  'background-color: #fff; border: 1px solid #000; padding: 8px 10px; border-radius: 6px; margin-left: -40px; margin-right: 0px;',
        button: 'background-color: #000; border-width: 0px; border-radius: 5px; padding: 5px 8px; color: #fff; text-align: center;',
        buttonWrapper: 'text-align: center; margin: 10px 0; clear: both;',
        code: 'font-family: "Courier New", Courier, monospace; background-color: #ddd; color: #000; padding: 2px 4px;',
        alert: 'color: #C91010; font-size: 1.5em; font-weight: bold; font-variant: small-caps; text-align: center;'
    },
    exhaustion_levels = [{level: 1, desc: "You have Disadvantage on ability checks."}, {level: 2, desc: "Your Speed is halved."}, {level: 3, desc: "You have Disadvantage on attack rolls and saving throws."}, {level: 4, desc: "Your Hit point maximum halved."}, {level: 5, desc: "Your Speed is reduced to 0."}, {level: 6, desc: "You are Dead!"}],

    checkInstall = function () {
        if (!_.has(state, 'ExhaustionTracker')) state['ExhaustionTracker'] = state['ExhaustionTracker'] || {};
        if (typeof state['ExhaustionTracker'].exhaustedMarker == 'undefined') state['ExhaustionTracker'].exhaustedMarker = 'half-haze';
        if (typeof state['ExhaustionTracker'].allowPlayerUse == 'undefined') state['ExhaustionTracker'].allowPlayerUse = false;
        log('--> ExhaustionTracker v' + version + ' <-- Initialized');
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
                    case 'set-marker':
                        if (playerIsGM(msg.playerid)) setMarker(msg, msg.content.split(/\s+/i).pop().toLowerCase());
                        break;
                    case 'markers':
                        if (playerIsGM(msg.playerid)) showMarkers();
                        break;
                    case 'toggle-players':
                        if (playerIsGM(msg.playerid)) togglePlayers(msg);
                        break;
                    case 'help':
                    case 'config':
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
        var button = '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!exhausted markers">Change Marker</a></div><br>';
        var message = '<span style=\'' + styles.code + '\'>!exhausted help</span><br>Sends this dialog to the chat window.<br><br>'
        + '<span style=\'' + styles.code + '\'>!exhausted show</span><br>Displays the Exhaustion Level for the selected character along with the accumulated effects.<br><br>';

        if (state['ExhaustionTracker'].allowPlayerUse || playerIsGM(msg.playerid)) {
            message += '<span style=\'' + styles.code + '\'>!exhausted+</span><br>Increases the selected character\'s Exhaustion Level by one, sets the appropriate Exhaustion Marker on the token, and displays the effects of the new Level.<br><br>'
            + '<span style=\'' + styles.code + '\'>!exhausted-</span><br>Decreases the selected character\'s Exhaustion Level by one, sets the appropriate Exhaustion Marker on the token, and displays the effects of the new Level.<br><br>Long Rest? Just use the sheet\'s Long Rest macro instead.<br><br>';
        }

        if (playerIsGM(msg.playerid)) {
            message += '<h4>Player Use</h4>';
            if (state['ExhaustionTracker'].allowPlayerUse) {
                message += 'You are currently configured to allow players to use ExhaustionTracker to adjust their own Exhaustion Levels.<br><div style="'
                + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!exhausted toggle-players">Disable</a></div><br>';
            } else {
                message += 'Players are not currently allowed to change their Exhaustion Levels, which is the default setting. However, you may want to enable this if they '
                + 'have macros they need to run in conjunction with other abilities. If this is the case, you mas set ExhaustionTracker to allow users to this functionality.'
                + '<br><div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!exhausted toggle-players">Enable</a></div><br>';
            }
        }

        message += '<h4>Exhaustion Marker</h4>' + getMarker(state['ExhaustionTracker'].exhaustedMarker, marker_style)
        + 'This is the current status marker to indicate Exhaustion. A number will appear on it to indicate the character\'s Exhaustion Level.';
        if (playerIsGM(msg.playerid)) message += button;

        if (playerIsGM(msg.playerid)) showAdminDialog('Help Menu', message);
        else showDialog('Help Menu', message, msg.who, true);
    },

    togglePlayers = function (msg) {
        state['ExhaustionTracker'].allowPlayerUse = !state['ExhaustionTracker'].allowPlayerUse;
        showHelp(msg);
    },

    setMarker = function (msg, marker) {
        var status_markers = ['blue', 'brown', 'green', 'pink', 'purple', 'red', 'yellow', 'all-for-one', 'angel-outfit', 'archery-target', 'arrowed', 'aura', 'back-pain', 'black-flag', 'bleeding-eye', 'bolt-shield', 'broken-heart', 'broken-shield', 'broken-skull', 'chained-heart', 'chemical-bolt', 'cobweb', 'dead', 'death-zone', 'drink-me', 'edge-crack', 'fishing-net', 'fist', 'fluffy-wing', 'flying-flag', 'frozen-orb', 'grab', 'grenade', 'half-haze', 'half-heart', 'interdiction', 'lightning-helix', 'ninja-mask', 'overdrive', 'padlock', 'pummeled', 'radioactive', 'rolling-bomb', 'screaming', 'sentry-gun', 'skull', 'sleepy', 'snail', 'spanner', 'stopwatch', 'strong', 'three-leaves', 'tread', 'trophy', 'white-tower'];
        if (_.find(status_markers, function (tmp) {return tmp === marker; })) {
            state['ExhaustionTracker'].exhaustedMarker = marker;
        } else {
            showAdminDialog('Error', 'The status marker "' + marker + '" is invalid. Please try again.');
        }
        showHelp(msg);
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
        var status_markers = ['blue', 'brown', 'green', 'pink', 'purple', 'yellow', 'sleepy', 'half-haze', 'back-pain', 'flying-flag'];
        var message = '<table style="border: 0; width: 100%;" cellpadding="0" cellspacing="2">';
        _.each(status_markers, function(marker) {
            message += '<tr><td>' + getMarker(marker, 'margin-right: 10px;') + '</td><td style="white-space: nowrap; width: 100%;">' + marker + '</td>';
            if (marker == state['ExhaustionTracker'].exhaustedMarker) {
                message += '<td style="text-align: center;">Current</td>';
            } else {
                message += '<td style="text-align: center; white-space: nowrap; padding: 7px;"><a style="' + styles.button + '" href="!exhausted set-marker ' + marker + '">Set Marker</a></td>';
            }
            message += '</tr>';
        });
        message += '<tr><td colspan="3" style="text-align: center; padding: 7px;"><a style="' + styles.button + '" href="!exhausted help">&#9668; Back</a> &nbsp; <a style="'
        + styles.button + '" href="!exhausted set-marker &#63;&#123;Status Marker&#124;&#125;">Different Marker</a></td></tr>';
        message += '</table>';
        showAdminDialog('Choose Exhaustion Marker', message);
    },

    getMarker = function (marker, style = '') {
        let X = '';
        let marker_style = 'width: 24px; height: 24px;';
        var marker_pos = {red:"#C91010",  blue: "#1076C9",  green: "#2FC910",  brown: "#C97310",  purple: "#9510C9",  pink: "#EB75E1",  yellow: "#E5EB75",  dead: "X",  skull: 0, sleepy: 34, "half-heart": 68, "half-haze": 102, interdiction: 136, snail: 170, "lightning-helix": 204, spanner: 238, "chained-heart": 272, "chemical-bolt": 306, "death-zone": 340, "drink-me": 374, "edge-crack": 408, "ninja-mask": 442, stopwatch: 476, "fishing-net": 510, overdrive: 544, strong: 578, fist: 612, padlock: 646, "three-leaves": 680, "fluffy-wing": 714, pummeled: 748, tread: 782, arrowed: 816, aura: 850, "back-pain": 884, "black-flag": 918, "bleeding-eye": 952, "bolt-shield": 986, "broken-heart": 1020, cobweb: 1054, "broken-shield": 1088, "flying-flag": 1122, radioactive: 1156, trophy: 1190, "broken-skull": 1224, "frozen-orb": 1258, "rolling-bomb": 1292, "white-tower": 1326, grab: 1360, screaming: 1394,  grenade: 1428,  "sentry-gun": 1462,  "all-for-one": 1496,  "angel-outfit": 1530,  "archery-target": 1564};

        if (typeof marker_pos[marker] === 'undefined') return false;

        if (Number.isInteger(marker_pos[marker])) {
            marker_style += 'background-image: url(https://roll20.net/images/statussheet.png);'
            + 'background-repeat: no-repeat; background-position: -' + marker_pos[marker] + 'px 0;';
        } else if (marker_pos[marker] === 'X') {
            marker_style += 'color: #C91010; font-size: 32px; font-weight: bold; text-align: center; padding-top: 5px; overflow: hidden;';
            X = 'X';
        } else {
            marker_style += 'background-color: ' + marker_pos[marker] + '; border: 1px solid #fff; border-radius: 50%;';
        }

        marker_style += style;

        return '<div style="' + marker_style + '">' + X + '</div>';
    },

    setLevel = function(msg, direction) {
        if (state['ExhaustionTracker'].allowPlayerUse || playerIsGM(msg.playerid)) {
            if (msg.selected) {
                _.each(msg.selected, function(obj) {
                    var token = getObj(obj._type, obj._id);
                    if (token && token.get('represents') !== '') {
                        var character = getObj('character', token.get('represents'));
                        var level = findObjs({ type: 'attribute', characterid: character.get('id'), name: 'exhaustion_level' })[0];

                        // Set attribute if character has never been exhausted before
                        if (!level) level = createObj("attribute", {characterid: character.get('id'), name: "exhaustion_level", current: 0});
                        if (level) {
                            // Change exhaustion level on character sheet
                            var currLevel = parseInt(level.get('current')), newLevel;
                            if (direction == 'up') newLevel = (currLevel < 6) ? currLevel + 1 : 6;
                            else newLevel = (currLevel > 0) ? currLevel - 1 : 0;
                            level.set('current', newLevel);

                            // Set status marker indicating exhaustion level
                            token.set('status_' + state['ExhaustionTracker'].exhaustedMarker, false);
                            var currMarkers = token.get("statusmarkers");
                            if (newLevel != 0) {
                                token.set({statusmarkers: currMarkers + ',' + state['ExhaustionTracker'].exhaustedMarker + '@' + newLevel});
                            }

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
        if (tokens) {
            _.each(tokens, function(obj) {
                var token = getObj(obj._type, obj._id);
                if (token && token.get('represents') !== '') {
                    var char = getObj('character', token.get('represents'));
                    if (char) {
                        var message, level = getLevel(char.get('id'));

                        // Check to see if the status marker is set. If not, set interval
                        var currMarkers = token.get("statusmarkers");
                        if (currMarkers.indexOf(state['ExhaustionTracker'].exhaustedMarker) == -1 && level != 0) {
                            token.set({statusmarkers: currMarkers + ',' + state['ExhaustionTracker'].exhaustedMarker + '@' + level});
                        }

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
                        showDialog('Exhaustion Level', message, char.get('name'), false);
                    }
                }
            });
        } else {
            if (playerIsGM(msg.playerid)) showAdminDialog('Error', 'You must select some character tokens first.');
            else showDialog('Error', 'You must select some character tokens first.', msg.who, true);
        }
    },

    getLevel = function(char_id) {
        var result = 0;
        var char = getObj('character', char_id);
        if (char) {
            var level = findObjs({ type: 'attribute', characterid: char_id, name: 'exhaustion_level' })[0];
            if (level) result = parseInt(level.get('current'));
        }
        return result;
    },

    //---- PUBLIC FUNCTIONS ----//

    registerEventHandlers = function () {
		on('chat:message', handleInput);
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
