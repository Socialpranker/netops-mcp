# VHS tape — records the live demo CLI into a terminal GIF.
# Install VHS (https://github.com/charmbracelet/vhs), then: vhs demo/demo.tape
# Produces assets/cli.gif from the REAL server (config_correlate is a genuine call).

Output assets/cli.gif

Require node

Set Shell "bash"
Set FontSize 18
Set Width 1200
Set Height 660
Set Padding 24
Set Theme "Github Dark"
Set TypingSpeed 0ms

Hide
Type "npm run build >/dev/null 2>&1" Enter
Sleep 1s
Show

Type "node demo/cli.mjs"
Sleep 500ms
Enter
Sleep 9s
