# ExhaustionTracker

This [Roll20](http://roll20.net/) script places an indicator on a character's token to indicate the Exhaustion Level for that character, updates the character's Exhaustion Level on the character sheet, and will show players their character's current Exhaustion Level along with the requisite effects/penalties. It is currently only for use with the [5e Shaped Sheet](http://github.com/mlenser/roll20-character-sheets/tree/master/5eShaped).

Changes made directly on the character sheet will update all of that character's tokens with the corresponding Exhaustion Marker. Also, characters with any level of exhaustion indicated on their character sheet will have their tokens updated with the corresponding Exhaustion Marker whenever they are dragged to the VTT.

## Exhaustion Marker

Exhaustion Marker is the status marker used to indicate exhaustion, and defaults to the "half-haze" status marker. The GM can change the Exhaustion Marker to any status marker desired. The Config Menu will show a list of buttons for some suggested markers, or you can use the "Different Marker" button to provide the name of any of the current valid status markers.

Note that because ExhaustionTracker updates status markers automatically, there could be conflict with scripts such as [StatusInfo](https://github.com/RobinKuiper/Roll20APIScripts/tree/master/StatusInfo), [EncumbranceTracker](https://github.com/blawson69/EncumbranceTracker) and others that also modify status markers. If changing the Exhaustion Marker, **make sure you choose a status marker that is not being used by another script.**

## Player Access

By default, changing a character's Exhaustion Level is available only for the GM, and players only have access to the `!exhausted show` and `!exhausted help` commands. If you have player macros that need to use the modification commands (such as a barbarian's Frenzy) or otherwise wish to give players the ability to change Exhaustion Levels, you can enable player access to those commands in the GM's Config Menu.

## Commands

`!exhausted config` displays a Config Menu that shows the current configuration option settings for the Exhaustion Marker and Player Access. GM only.

`!exhausted help` sends a Help Menu to the chat with the commands listed below and the icon for the current Exhaustion Marker. If Player Access is disabled, players will only see the "show" command.

`!exhausted+` increases the selected character's Exhaustion Level by one, sets the appropriate marker on the token, and displays the effects of the new Level in chat.

`!exhausted-` decreases the selected character's Exhaustion Level by one, sets the appropriate marker on the token, and displays the effects of the new Level in chat.

`!exhausted show` will display the Exhaustion Level for all selected characters, along with the accumulated effects of exhaustion based on their level. If the Shaped Sheet already has any levels of exhaustion indicated and the token does not show the Exhaustion Marker, ExhaustionTracker will add the Exhaustion Marker to token along with a number indicating the level of exhaustion.

`!exhausted update` will update the Exhaustion Level for all selected tokens based on the character sheet. This is useful after calling the [Shaped Script's](https://github.com/mlenser/roll20-api-scripts/tree/master/5eShapedScript) `!shaped-rest` command because ExhaustionTracker cannot detect that change.
