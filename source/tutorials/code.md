# code tutorial
welcome to the code tutorial!

hit `escape` or the **x-button** ![](x-button.svg) to look up the code structure of the slide, explore the menus and play around with the content.
a click on the **play button** ![](playbutton.svg) brings you back to the preview.

---
## slidenotes & code

we love to code.
but what we don't like is this weekly drama of making a presentation about the new development. often at the latest moment. but copying it in the gui is not nearly enough—you have to reformat it, give your code some meaning, give it some syntax-highlighting and structure it in a way that your clients or your ceo understands. and sees the beauty in it!

well, don't suffer anymore—slidenotes will make your code look good inside your presentation while keeping your amount of work at a minimum.
maybe you shouldn't tell your boss how fast it is, otherwise they want a presentation every day?

let's dive into this topic and get it done ➡︎

---
## inline code

you want to show some code inside a line of normal text?

put it between two backticks ~`~

+++code
this is normal text. `and this is inline code.`
+++

this is normal text. `and this is inline code.`

---
## inline code: showing backticks

you want to actually show a backtick as part of an inline code segment?

use a backslash ~\~ in front of it—they make hidden symbols appear:

+++code
`this inline code shows a backtick: \\``
+++

`this inline code shows a backtick: \``

let's hop on to code blocks ➡︎

---
## code blocks

code blocks transform a bunch of written code into a beautifully rendered block with automagical syntax highlighting.
it's written like any other slidenote block: 
the first ~+++code~ block line and the last ~+++~ contain all lines of code in between:

```code
+++code
code lines inside the code block
var mycode = "is super beautiful";
+++
```

if you like, you can use an alternative container built out of triple backtick lines:

+++code:md
```
code lines inside the code block
var mycode = "is super beautiful";
```
+++


---
## code blocks: options

we put some more love into code blocks than just some syntax highlighting. 
by altering the ~+++code~ block head with the ~:option~ flag, you can make use of these advanced options. 
just add a ~---~ line inside to seperate the configuration options from the actual code: 

```code
+++code:options
this is the options section
---
this is the code section
+++
```

let's check out more options ➡︎
---
## code blocks: options

+++layout:left
let's say you want to highlight one line.
so you add ~linehighlight=~ to the options section.
then you declare the line's number—in this case it's ~3~.

###editor

```code
+++code:options
linehighlight=3
---
the first two lines will fade away
'cause they're not as important
as the third highlighted one
+++
```

###presentation mode

+++code:options
linehighlight=3
---
the first two lines will fade away
'cause they're not as important
as the third highlighted one
+++
+++

---
## code blocks: options overview
as for now we support the following options:

+++layout:left
### line numbering
~linenumbering~ controls if line numbers appear in the output. 
in default it's turned on, but you can also set it ~=off~.
+++

+++layout:left
### line numbering start
~linenumberingstart~ defines the start line for the output if line numbering is activated. 
in default this would be line 1—but if the original code snippet you want to present starts in line 50 and you want the output to reflect that, set it to ~=50~.
+++

+++layout:left
### language
while the editor tries to figure out automatically which language it should use for syntax highlighting, sometimes it does not get it right. 
if this happens, you can try directly defining the ~language~. 
*language is also the only option you can directly declare in the header itself—more on that on [slide 11](#slide11).*
+++

---
## code blocks: options overview

+++layout:left
### linehighlight
if you want to set the focus to certain lines of your code, ~linehighlight~ is an easy solution. 
just type in the numbers of these lines: seperate multiple numbers with a comma ~linehighlight=1,2,3~ 
and declare line spans with a dash ~linehighlight=1-3~.
*if you're not sure or to lazy to count, look up the correct line numbers as shown in presentation mode.*
+++

+++layout:left
### speciallinemarker
another way to highlight a line is to mark it as special.
in default mode you can do so by adding ~§§~ directly at its beginning:
~§§ this is my special line~.
with the ~speciallinemarker~ you can declare other signs than ~§§~ to have the same effect.
so with ~speciallinemarker=!~
~! now this is my special line~.
+++

+++layout:left
### specialstartmarker & specialendmarker
you want to highlight only a part of a line? 
you can do so by marking them as special with a start and end marker.
in default mode these are ~§(~ and ~)§~ but you can change them anytime:
if ~specialstartmarker=>~ 
and ~specialendmarker=<~, 
~>this code<~ will be highlighted.
+++

---
## context menu to the help

+++layout:left
you don't have to remember every option. you can look them all up in the **code context menu** ![](context-menu_code.svg) which appears on the left whenever your cursor is inside a code block. it will insert the option at the right place, giving you hints how to use it. 
just press `escape` and try it for yourself. here are some examples for you:
+++

+++code
my_function_call(lets, test, it){
 //here comes my logic
§§ return lets[test.length - it].result;
};
+++

+++code:options
linenumbering=off
---
my_function_call(lets, test, it){
 //here comes my logic
 return lets[test.length - it].result;
};
+++

+++code:options
linehighlight=1,3
---
my_function_call(lets, test, it){
 //here comes my logic
 return lets[test.length - it].result;
};
+++

+++code:options
specialstartmarker=§a
specialendmarker=§e
---
my_function_call(lets, test, it){
 //here comes my logic
 return §a lets[test.length - it]§e.result;
};
+++
---
## declaring language in the header

the shorter the code, the more likely slidenotes will have difficulties to recognize the correct language. to make things easier for smaller code blocks, where you don't want to add other options than the language, you can enter your language to the header with a ~:~ like this:
+++code
 +++code:javascript
    alert:('hello world');
 +++
+++

if you prefer the github-style you can also use that to declare the language:
+++code:markdown
```markdown
# hello world
```
+++

---
## language support

we use the awesome [highlight.js](https://highlightjs.org) library for adding a sweet syntax highlighting to the code segments of your presentation. 
it supports more than 190 languages—so chances are: yours too! [^*]

we also facilitated the process of naming with aliases. 
it doesn't matter if you write ~javascript~, ~Javascript~, ~JavaScript~, ~Java-Script~ or just ~js~. 
(or ~objective-c~, ~ObjectiveC~, ~Objective-C~, ...)

our goal is to be as intuitive as possible: focus on the content, not on how to write it.

[^*]:if you're still in doubt check out their [demo page](https://highlightjs.org/static/demo) and see for yourself!
---
#there's more!

we're constantly working on implementing more features and improving the ones we have. please hit us with any suggestions, questions or feedback under **options** → **feedback** or [hi@slidenotes.io](mailto:hi@slidenotes.io) so we can improve the tutorials and the slidenote editor for you.

||€€imagepart€€||
[{"names":["playbutton.svg"],"filename":"playbutton.svg","base64url":"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxNDcgMTQ2IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPjxwYXRoIGQ9Ik04MS4xMzQsMjEuNjY1YzMxLjQ1Nyw2LjY3MiA2Ny4wNTEsMjMuMzA5IDY1LjM4MSw3NC4xNjZjLTAuNzI2LDIyLjExIC04LjE5OSwzOC40MzYgLTIwLjE4Miw1MC4xNjlsLTEyNi4zMzMsMGwwLC0xNDZjMS43NTgsMC42MjUgMy41NDEsMS42ODggNS4zNDEsMy4yNGMxNS4zNDIsMTMuMjE2IDU2LjA5LDE0LjI0NSA3NS43OTMsMTguNDI1WiIgc3R5bGU9ImZpbGw6dXJsKCNfTGluZWFyMSk7Ii8+PHBhdGggZD0iTTUzLjUyNCw2NS41MTNjMC42ODEsMC4wOTkgMC43MjgsMC4xOTkgMS4wMjIsMC40MDNsMzIuMjQyLDI0LjY3MmMxLjAzNCwwLjg3IDAuOTU1LDIuNTU1IC0wLjE5OSwzLjMxMWwtMzIuMjQyLDE5LjAyNGMtMS4yODEsMC42NzggLTIuOTQ3LC0wLjIgLTMuMDE3LC0xLjcyM2wwLC00My42OTZjMC4wNTMsLTEuMTQ5IDEuMDA4LC0yLjA1MSAyLjE5NCwtMS45OTFaIiBzdHlsZT0iZmlsbDojZmZmO2ZpbGwtb3BhY2l0eTowLjg4OyIvPjxwYXRoIGQ9Ik03Ny4xNDMsMjguMDU3YzEyLjc4NCwzLjA5OCAyMi42MzUsOC41MTcgMTkuNTEsMTQuMjE2Yy0zLjQxOCw2LjIzNCAtMTQuNzgxLDUuODg0IC0yNy41NjUsMi43ODZjLTEyLjc4MywtMy4wOTggLTIzLjYzOCwtNy4zMTYgLTIxLjk2NCwtMTQuMjI1YzEuNjc1LC02LjkxIDE3LjIzNSwtNS44NzUgMzAuMDE5LC0yLjc3N1oiIHN0eWxlPSJmaWxsOiNmZmY7ZmlsbC1vcGFjaXR5OjAuMTU7Ii8+PHBhdGggZD0iTTExNC42NDgsNDQuMDc1YzMuMjgzLDEuOTAyIDUuOTg2LDYuNjE4IDMuNjQzLDEwLjVjLTIuMzQzLDMuODgzIC02LjgxOSwyLjc3NCAtMTAuMjM2LDAuODIyYy02LjMxOCwtMy42MDggLTUuNDQyLC02LjkwNiAtNC4xNjYsLTkuMTc2YzIuMjIyLC0zLjk1MyA2LjY3NCwtNC41MTIgMTAuNzU5LC0yLjE0NloiIHN0eWxlPSJmaWxsOiNmZmY7ZmlsbC1vcGFjaXR5OjAuMTU7Ii8+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJfTGluZWFyMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDE3Ny41NjUsLTI0OC44ODYsMjQ4Ljg4NiwxNzcuNTY1LDMuOTU1MTksMTc5LjM5KSI+PHN0b3Agb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojY2Q3YjY3O3N0b3Atb3BhY2l0eTowLjg4Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojNzJjM2QzO3N0b3Atb3BhY2l0eTowLjg4Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+"},{"names":["context-menu_code.svg"],"filename":"context-menu_code.svg","base64url":"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA4OCAyOSIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxuczpzZXJpZj0iaHR0cDovL3d3dy5zZXJpZi5jb20vIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjI7Ij48Zz48cGF0aCBkPSJNNzUuNTI0LDguODAxYzAsLTQuODU3IC0zLjk0NCwtOC44MDEgLTguODAxLC04LjgwMWwtNTcuOTIyLDBjLTQuODU3LDAgLTguODAxLDMuOTQ0IC04LjgwMSw4LjgwMWwwLDExLjMzNWMwLDQuODU3IDMuOTQ0LDguODAxIDguODAxLDguODAxbDU3LjkyMiwwYzQuODU3LDAgOC44MDEsLTMuOTQ0IDguODAxLC04LjgwMWwwLC0xMS4zMzVaIiBzdHlsZT0iZmlsbDojMTI1ZTY5OyIvPjxwYXRoIGQ9Ik03OC40MTMsNC4wOTVjMC4yMjYsMC4wMjggMC40MzMsMC4xMiAwLjYwNiwwLjI3Mmw3Ljc3MSw3LjM4NmMwLjM5OCwwLjQwOCAwLjM5MiwxLjA1NCAtMC4wMDcsMS40NTVsLTcuNzU1LDcuMjQ4Yy0xLjE5MiwxLjAzNCAtMS42NTYsLTAuMDQ1IC0xLjY4MywtMC43MjlsLTAuMDE1LC0xNC42MzRjMC4wMjEsLTAuNTgxIDAuMzMyLC0xLjAzMiAxLjA4MywtMC45OThaIiBzdHlsZT0iZmlsbDojMTI1ZTY5OyIvPjxwYXRoIGQ9Ik02MC41MzYsMTEuODYxYzAuMjY2LDAuMDI0IDAuNTA1LDAuMTQgMC42ODgsMC4zMzVsMy43ODIsNC4yNjZjMCwtMCA0LjA5MywtNC4xNzkgNC4wOTMsLTQuMTc5YzAuNzU1LC0wLjY0NCAyLjIzMiwwLjQwOCAxLjQyNiwxLjM5NmMtMS41NjMsMS42OTcgLTMuMjI2LDMuMyAtNC44NCw0Ljk0OWMtMC4zOTQsMC4zNzggLTEuMDI0LDAuMzgyIC0xLjQyMiwwLjAwOGMtMS41NjIsLTEuNjU4IC0zLjAyNCwtMy40MDkgLTQuNTM1LC01LjExNGMtMC41MTksLTAuNjIxIC0wLjE4MiwtMS42OTEgMC44MDgsLTEuNjYxWiIgc3R5bGU9ImZpbGw6I2ZmZjsiLz48dGV4dCB4PSIxMC40MTVweCIgeT0iMjAuODU0cHgiIHN0eWxlPSJmb250LWZhbWlseTonUnViaWstUmVndWxhcicsICdSdWJpayc7Zm9udC1zaXplOjE3cHg7ZmlsbDojZmZmOyI+Yzx0c3BhbiB4PSIxOS42MjlweCAyOS4yMTdweCAzOS4xNjJweCAiIHk9IjIwLjg1NHB4IDIwLjg1NHB4IDIwLjg1NHB4ICI+b2RlPC90c3Bhbj48L3RleHQ+PC9nPjwvc3ZnPg=="},{"names":["x-button.svg"],"filename":"x-button.svg","base64url":"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA1MiA1MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxuczpzZXJpZj0iaHR0cDovL3d3dy5zZXJpZi5jb20vIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjI7Ij48cGF0aCBkPSJNMjUuODk1LDAuMTczYy0xNC40MzUsMS42MiAtMjMuNDgxLDguNTc5IC0yNS42MTgsMjEuODJjLTIuNDAxLDE0Ljg4MSAxMS4xNzcsMjcuMSAyNi41NDYsMjcuMWMxNS4zNjksMCAyNC44ODgsLTkuMjMgMjQuODg4LC0yNC4zMDRjLTAsLTE1LjA3NCAtMTAuNTQzLC0yNi4zMzEgLTI1LjgxNiwtMjQuNjE2WiIgc3R5bGU9ImZpbGw6dXJsKCNfTGluZWFyMSk7Ii8+PHBhdGggaWQ9IngiIGQ9Ik0yNS44NTUsMjEuMjc1bDQuOTk4LC00Ljk5OGMwLjgxNCwtMC44MTMgMi4xMzQsLTAuODEzIDIuOTQ3LDBjMC44MTQsMC44MTMgMC44MTQsMi4xMzQgMCwyLjk0N2wtNC45OTgsNC45OThsNC45OTgsNC45OThjMC44MTQsMC44MTMgMC44MTQsMi4xMzQgMCwyLjk0N2MtMC44MTMsMC44MTQgLTIuMTMzLDAuODE0IC0yLjk0NywwbC00Ljk5OCwtNC45OThsLTQuOTk4LDQuOTk4Yy0wLjgxMywwLjgxNCAtMi4xMzMsMC44MTQgLTIuOTQ3LDBjLTAuODEzLC0wLjgxMyAtMC44MTMsLTIuMTM0IDAsLTIuOTQ3bDQuOTk4LC00Ljk5OGwtNC45OTgsLTQuOTk4Yy0wLjgxMywtMC44MTMgLTAuODEzLC0yLjEzNCAwLC0yLjk0N2MwLjgxNCwtMC44MTMgMi4xMzQsLTAuODEzIDIuOTQ3LDBsNC45OTgsNC45OThaIiBzdHlsZT0iZmlsbDojMmYyZjJmOyIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iX0xpbmVhcjEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCg2NC4yOTc1LC01NS44NzY5LDU1Ljg3NjksNjQuMjk3NSwxLjcwNTNlLTEzLDQ5LjA5MzMpIj48c3RvcCBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiM2MDYwNjA7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48L3N2Zz4="}]