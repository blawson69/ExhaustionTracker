# ExhaustionTracker

This [Roll20](http://roll20.net/) script places an indicator on a character's token to indicate the Exhaustion Level for that character, updates the character's Exhaustion Level on the character sheet, and will show players their character's current Exhaustion Level along with the requisite effects/penalties. It is currently only for use with the [5e Shaped Sheet](http://github.com/mlenser/roll20-character-sheets/tree/master/5eShaped).

Changes made on the character sheet will update the character's token with the corresponding Exhaustion Marker. Note that the player ribbon must be on the current page for the token to be updated. Also, characters with any level of exhaustion indicated on their character sheet will have their tokens updated with the corresponding Exhaustion Marker whenever they are dragged to the VTT.

## Config

Typing `!exhausted help` in the chat will display a Help Menu that gives a summary of the information below. For GMs it also displays the current configuration option settings and provides links to change those settings.

## Exhaustion Marker

Exhaustion Marker is the status marker used to indicate exhaustion, and defaults to the "half-haze" status marker. The GM can change the Exhaustion Marker to any status marker desired. The Config Menu has a convenient link to use some suggested markers, or you can use the "Different Marker" button to provide the name of any of the current valid status markers.

## Player Access

By default, ExhaustionTracker is available only for the GM, and players can only use the `!exhausted show` to view their character's Exhaustion Level and the accumulated effects. If you have player macros that need to use the modification commands (such as a barbarian's Frenzy), you can enable player access to those commands in the GM's help dialog.

## Commands

`!exhausted show` will display the Exhaustion Level for all selected characters, along with the accumulated effects of exhaustion based on their level. If the Shaped Sheet already has any levels of exhaustion indicated and the token does not show the Exhaustion Marker, ExhaustionTracker will add the Exhaustion Marker to token along with a number indicating the level of exhaustion.

`!exhausted+` increases the selected character's Exhaustion Level by one, sets the appropriate marker on the token, and displays the effects of the new Level.

`!exhausted-` decreases the selected character's Exhaustion Level by one, sets the appropriate marker on the token, and displays the effects of the new Level.
