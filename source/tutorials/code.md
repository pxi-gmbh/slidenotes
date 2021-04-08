# code tutorial
welcome to the code tutorial!

this tutorial explains how to use code in your slidenotes.
press `ctrl/cmd+enter` or click on the **play button**![](playbutton.svg) to begin the presentation

---
## slidenotes & code

we love to code.
but what we don't like is this weekly drama of making a presentation about the new development. often at the latest moment. but copying it in the gui is not nearly enough—you have to reformat it, give your code some meaning, give it some syntax-highlighting and structure it in a way that your clients or your ceo understands. And sees the beauty in it!

well, don't suffer anymore—slidenotes will make your code look good inside your presentation while keeping your amount of work at a minimum.
maybe you shouldn't tell your boss how fast it is, otherwise he wants a presentation every day?

lets dive into this topic and get it done!

---
## code inline

a *"code"* in slidenotes means that the content of it will not be interpreted as md-code but as text.
so if you want to put some code into a line of normal text you put it inside two back-ticks\`*some code here*\`: `**some code here**`

as you can see, the `*` are not interpreted but displayed as normal text and highlighted as a code-segment.

this is the *inline-style* of baking code into your presentations. inline code can not be altered or configured more than that, as they are meant only for small inline-segments.

if you want to write backticks inside the code-segment you simply put a `\ ` in front of it like so: \\` ->`\``

next: code blocks ➡︎
---
## code as blocks

code blocks transform a bunch of written code into a beautifully rendered block. the code block makes  use of syntax-highlighting automagically.

a code block is written like any other special blocks in slidenotes: it starts with a line containing the code block *head* `+++code` followed by lines of code and closed by a line containing the end-sign of the block `+++`. so a code block looks like this:

```code
+++code
var mycode = "is super beautiful";
+++
```

alternatively you can also use three back-ticks if you prefer:
+++code:md
```
var mycode = "is super beautiful";
```
+++


---
## advanced configuration
of your code blocks

we put some more love into code blocks than just some syntax-highlighting. to make use of the advanced options you have to declare it inside the code block head by giving it the *options-flag* `:options`

now you can insert a *new-slide symbol* `---` into a line in the code block to separate between config-options (all above the ---)  and your code.

---

let's say you want to highlight one line:

### sourcecode
+++code:options
---
 +++code:options
 linehighlight=3
 ---
 my_superfunction(){
  //the following line is what i want to focus your attention on:
  parentelement.dosomethingveryspecial();
 }
  +++
+++

### result:
+++code:options
linehighlight=3
---
my_superfunction(){
  //the following line is what i want to focus your attention on:
  parentelement.dosomethingveryspecial();
}
+++


---
## overview over advanced options 
as for now we support the following options:

+++layout:left
### linenumbering
*linenumbering* controls if you want to make line numbers appear in the output. it can be *"on"* or *"off"*, default is *"on"*
+++


+++layout:left
### linenumberingstart
*linenumberingstart* defines the start-line for the output if line numbering is activated. if your original code-snippet you want to present starts in line 50 and you want the output to reflect that: put it to 50. it expects a number. default is 1.
+++


+++layout:left
### language
while the editor tries to figure out automatically which language it should use for syntaxhighlighting, sometimes it does not get it right. if this happens you can try it by directly defining it here. *language is also the only option you can directly declare in the header itself—more on that on [slide 10](#slide10)*
+++


---
## overview over advanced options 
+++layout:left
### linehighlight
if you want to highlight some lines of your code to make them more attractive, *linehighlight* is one easy solution for that. 
just type in the numbers of lines that you want to highlight. make sure the line number is counted in the code-part of the codeblock. so first line in your codepart is line 1 and so forth. you can enter multiple numbers separated by comma: `linehighlight=3,5,7` and also line-spans like 1-3: `linehighlight=3-6`
+++


+++layout:left
### speciallinemarker
the *speciallinemaker* *"marks"* a line to be used as a highlighted line. therefore you insert the speciallinemarker at the beginning of the target line:`§§ my special line`
with the option `speciallinemarker` you can define what signs should be interpreted as such markers. default is `§§`.
+++


+++layout:left
### specialstartmarker and specialendmarker
you want to highlight only a part of a line? you can do that by marking them as special with a start- and end-marker. the option `specialstartmarker` lets you define the syntax used for the beginning and `specialendmarker` the end of your marks.
defaults: `specialstartmarker=§(` and `specialendmarker=)§`
+++


---
## context-menu to the help

+++layout:left
you dont have to remember every option to use them. whenever your cursor is inside a code block you can use the **context-menu** ![](context-menu_code.svg) on the left side of the textarea to help you out. it will insert the option at the right place, giving you hints how to use it. just press `escape` and try it for yourself.
here are some examples for you:
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


+++code
my_function_call(lets, test, it){
 //here comes my logic
§§ return lets[test.length - it].result;
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

the shorter the code, the more likely slidenotes will fail to detect the correct language. to make things easier for smaller codeblocks, where you don't want to add other options then the language, you can enter your language attached with a `:` to the header:
+++code
 +++code:javascript
    alert:('hello world');
 +++
+++

+++code:javascript
    alert:('hello world');
+++

if you prefer the github-style you can also use that to declare the language:
+++code:markdown
```markdown
# hello world
```
+++

```markdown
# hello world
```

---
## language support

under the hood we use the awesome [highlight.js](https://highlightjs.org) library for adding a sweet syntax-highlightning to the code of the presentation. it supports more than 190 languages as of now, so fear not that your language is not supported. [^*]

we also facilitated the process of naming with aliases, so it does not matter if you write javascript, Javascript, JavaScript, Java-Script or just js... (or objective-c, ObjectiveC, Objective-C...)

our goal is to be as intuitive as possible: focus on the content, not on how to write it


[^*]:if you are still worried check out their [Demo page](https://highlightjs.org/static/demo) and see for yourself
---
#there's more!

we're constantly working on implementing more features and improving the ones we have.
if you have any suggestion—drop us a message under `options → feedback` or [hi@slidenotes.io](mailto:hi@slidenotes.io)

||€€imagepart€€||
[{"names":["playbutton.svg"],"filename":"playbutton.svg","base64url":"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxNDcgMTQ2IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPjxwYXRoIGQ9Ik04MS4xMzQsMjEuNjY1YzMxLjQ1Nyw2LjY3MiA2Ny4wNTEsMjMuMzA5IDY1LjM4MSw3NC4xNjZjLTAuNzI2LDIyLjExIC04LjE5OSwzOC40MzYgLTIwLjE4Miw1MC4xNjlsLTEyNi4zMzMsMGwwLC0xNDZjMS43NTgsMC42MjUgMy41NDEsMS42ODggNS4zNDEsMy4yNGMxNS4zNDIsMTMuMjE2IDU2LjA5LDE0LjI0NSA3NS43OTMsMTguNDI1WiIgc3R5bGU9ImZpbGw6dXJsKCNfTGluZWFyMSk7Ii8+PHBhdGggZD0iTTUzLjUyNCw2NS41MTNjMC42ODEsMC4wOTkgMC43MjgsMC4xOTkgMS4wMjIsMC40MDNsMzIuMjQyLDI0LjY3MmMxLjAzNCwwLjg3IDAuOTU1LDIuNTU1IC0wLjE5OSwzLjMxMWwtMzIuMjQyLDE5LjAyNGMtMS4yODEsMC42NzggLTIuOTQ3LC0wLjIgLTMuMDE3LC0xLjcyM2wwLC00My42OTZjMC4wNTMsLTEuMTQ5IDEuMDA4LC0yLjA1MSAyLjE5NCwtMS45OTFaIiBzdHlsZT0iZmlsbDojZmZmO2ZpbGwtb3BhY2l0eTowLjg4OyIvPjxwYXRoIGQ9Ik03Ny4xNDMsMjguMDU3YzEyLjc4NCwzLjA5OCAyMi42MzUsOC41MTcgMTkuNTEsMTQuMjE2Yy0zLjQxOCw2LjIzNCAtMTQuNzgxLDUuODg0IC0yNy41NjUsMi43ODZjLTEyLjc4MywtMy4wOTggLTIzLjYzOCwtNy4zMTYgLTIxLjk2NCwtMTQuMjI1YzEuNjc1LC02LjkxIDE3LjIzNSwtNS44NzUgMzAuMDE5LC0yLjc3N1oiIHN0eWxlPSJmaWxsOiNmZmY7ZmlsbC1vcGFjaXR5OjAuMTU7Ii8+PHBhdGggZD0iTTExNC42NDgsNDQuMDc1YzMuMjgzLDEuOTAyIDUuOTg2LDYuNjE4IDMuNjQzLDEwLjVjLTIuMzQzLDMuODgzIC02LjgxOSwyLjc3NCAtMTAuMjM2LDAuODIyYy02LjMxOCwtMy42MDggLTUuNDQyLC02LjkwNiAtNC4xNjYsLTkuMTc2YzIuMjIyLC0zLjk1MyA2LjY3NCwtNC41MTIgMTAuNzU5LC0yLjE0NloiIHN0eWxlPSJmaWxsOiNmZmY7ZmlsbC1vcGFjaXR5OjAuMTU7Ii8+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJfTGluZWFyMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDE3Ny41NjUsLTI0OC44ODYsMjQ4Ljg4NiwxNzcuNTY1LDMuOTU1MTksMTc5LjM5KSI+PHN0b3Agb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojY2Q3YjY3O3N0b3Atb3BhY2l0eTowLjg4Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojNzJjM2QzO3N0b3Atb3BhY2l0eTowLjg4Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+"},{"names":["context-menu_code.svg"],"filename":"context-menu_code.svg","base64url":"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA4OCAyOSIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxuczpzZXJpZj0iaHR0cDovL3d3dy5zZXJpZi5jb20vIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjI7Ij48Zz48cGF0aCBkPSJNNzUuNTI0LDguODAxYzAsLTQuODU3IC0zLjk0NCwtOC44MDEgLTguODAxLC04LjgwMWwtNTcuOTIyLDBjLTQuODU3LDAgLTguODAxLDMuOTQ0IC04LjgwMSw4LjgwMWwwLDExLjMzNWMwLDQuODU3IDMuOTQ0LDguODAxIDguODAxLDguODAxbDU3LjkyMiwwYzQuODU3LDAgOC44MDEsLTMuOTQ0IDguODAxLC04LjgwMWwwLC0xMS4zMzVaIiBzdHlsZT0iZmlsbDojMTI1ZTY5OyIvPjxwYXRoIGQ9Ik03OC40MTMsNC4wOTVjMC4yMjYsMC4wMjggMC40MzMsMC4xMiAwLjYwNiwwLjI3Mmw3Ljc3MSw3LjM4NmMwLjM5OCwwLjQwOCAwLjM5MiwxLjA1NCAtMC4wMDcsMS40NTVsLTcuNzU1LDcuMjQ4Yy0xLjE5MiwxLjAzNCAtMS42NTYsLTAuMDQ1IC0xLjY4MywtMC43MjlsLTAuMDE1LC0xNC42MzRjMC4wMjEsLTAuNTgxIDAuMzMyLC0xLjAzMiAxLjA4MywtMC45OThaIiBzdHlsZT0iZmlsbDojMTI1ZTY5OyIvPjxwYXRoIGQ9Ik02MC41MzYsMTEuODYxYzAuMjY2LDAuMDI0IDAuNTA1LDAuMTQgMC42ODgsMC4zMzVsMy43ODIsNC4yNjZjMCwtMCA0LjA5MywtNC4xNzkgNC4wOTMsLTQuMTc5YzAuNzU1LC0wLjY0NCAyLjIzMiwwLjQwOCAxLjQyNiwxLjM5NmMtMS41NjMsMS42OTcgLTMuMjI2LDMuMyAtNC44NCw0Ljk0OWMtMC4zOTQsMC4zNzggLTEuMDI0LDAuMzgyIC0xLjQyMiwwLjAwOGMtMS41NjIsLTEuNjU4IC0zLjAyNCwtMy40MDkgLTQuNTM1LC01LjExNGMtMC41MTksLTAuNjIxIC0wLjE4MiwtMS42OTEgMC44MDgsLTEuNjYxWiIgc3R5bGU9ImZpbGw6I2ZmZjsiLz48dGV4dCB4PSIxMC40MTVweCIgeT0iMjAuODU0cHgiIHN0eWxlPSJmb250LWZhbWlseTonUnViaWstUmVndWxhcicsICdSdWJpayc7Zm9udC1zaXplOjE3cHg7ZmlsbDojZmZmOyI+Yzx0c3BhbiB4PSIxOS42MjlweCAyOS4yMTdweCAzOS4xNjJweCAiIHk9IjIwLjg1NHB4IDIwLjg1NHB4IDIwLjg1NHB4ICI+b2RlPC90c3Bhbj48L3RleHQ+PC9nPjwvc3ZnPg=="}]