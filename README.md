# ExhaustionTracker

This [Roll20](http://roll20.net/) script places an indicator on a character's token to indicate the exhaustion level for that character, updates the character's exhaustion level on the character sheet, and will show players their character's current exhaustion level along with the requisite effects/penalties. It is currently only for use with the [5e Shaped Sheet](http://github.com/mlenser/roll20-character-sheets/tree/master/5eShaped).

## Config

Typing `!exhausted help` in the chat will display a Help Menu that gives a summary of the information below. For GMs it also displays the current configuration option settings and provides links to change those settings.

## Exhaustion Marker

Exhaustion Marker is the status marker used to indicate exhaustion, and defaults to the "half-haze" status marker. The GM can change the Exhaustion Marker to any status marker desired. The Config Menu has a convenient link to use some suggested markers, or you can use the "Different Marker" button to provide the name of any of the current valid status markers.

## Player Access

By default, ExhaustionTracker is available only for the GM, and players can only use the `!exhausted show` to view their character's Exhaustion Level and the accumulated effects. If you have player macros that need to use the modification commands (such as a barbarian's Frenzy), you can enable player access to those commands in the GM's help dialog.

## Commands

`!exhausted show` will display the Exhaustion Level for all selected characters. If the Shaped Sheet already has any levels of exhaustion indicated, ExhaustionTracker will add the Exhaustion Marker to token along with a number indicating the level of exhaustion. The dialog also gives the accumulated effects of exhaustion based on that level.

`!exhausted+` increases the selected character's Exhaustion Level by one, sets the appropriate marker on the token, and displays the effects of the new Level.

`!exhausted-` decreases the selected character's Exhaustion Level by one, sets the appropriate marker on the token, and displays the effects of the new Level. If the reduction of exhaustion is due to a Long Rest, it is highly recommended to use the sheet's Long Rest macro instead to insure all other effects of a Long Rest be implemented.
