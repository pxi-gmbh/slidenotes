# code tutorial
welcome to the code tutorial!

this tutorial explains how to use code in your slidenotes.

to begin the presentation press `ctrl/cmd+enter` or the `play button`

---
## slidenotes & code

we love to code.
but what we don't like is this weekly drama of making a presentation about the new development. often at the latest moment. but copying it in the gui is not nearly enough—you have to reformat it, give your code some meaning, give it some syntax-highlighting and structure it in a way that your clients or your ceo understands. And sees the beauty in it!

well, don't suffer anymore—slidenotes will make your code look good inside your presentation while keeping your amount of work at a minimum.
maybe you shouldn't tell your boss how fast it is, otherwise he wants a presentation every day?

lets dive into this topic and get it done!

---
## code inline

a "code" in slidenotes means, that the content of it will not be interpreted as md-code but as text and rendered likewise.
so if you want to put some code into a line of normal text you put it inside two back-ticks\`**some code here**\`: `**some code here**`

as you can see, the `**` are not interpreted but displayed as normal text and highlighted as a code-segment.

this is the **inline-style** of baking code into your presentations. inline code can not be altered or configured more than that, as they are meant only for small inline-segments.

if you want to write backticks inside the code-segment you simply put a `\ ` in front of it like so: \\` ->`\``

next: code blocks ➡︎
---
## code as blocks

code blocks transform a bunch of written code into a beautifully rendered block. the code block makes  use of syntax-highlighting automagically.

a code block is written like any other special blocks in slidenotes: it starts with a line containing the code block **head** `+++code` followed by lines of code and closed by a line containing the end-sign of the block `+++`. so a code block looks like this:

```code
+++code
var mycode = "is super beautiful";
+++
```

alternatively you can also use three back-ticks if you prefer
+++code:md
```
var mycode = "is super beautiful";
```
+++


---
## advanced configuration
of your code blocks

we put some more love into code blocks than just some syntax-highlighting. to make use of the advanced options you have to declare it inside the code block head by giving it the *options-flag* `:options`

now you can insert a new-slide symbol `---` into a line in the code block to separate between config-options (all above the ---)  and your code.

---

let's say you want to highlight one line:

### sourcecode
+++code:options
language=none
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
## overview over advanced options 1
as for now we support the following options:

+++layout:left
### linenumbering
linenumbering controls if you want to make linenumbers appear in the output. it can be *"on"* or *"off"*, default is *"on"*
+++


+++layout:left
### linenumberingstart
linenumberingstart defines the start-line for the output if linenumbering is activated. if your original code-snippet you want to present starts in line 50 and you want the output to reflect that put it to 50. it expects a number, default is 1.
+++


+++layout:left
### language
while the editor tries to figure out automatically which language it should use for syntaxhighlighting, sometimes it does not get it right. if this happens you can try it by directly defining it here. *language is also the only option you can directly declare in the header itself—more on that on [slide 10](#slide10)*
+++


---
## overview over advanced options 2
+++layout:left
### linehighlight
if you want to highlight some lines of your code to make them more attractive, *linehighlight* is one easy solution for that. just type in the numbers of lines that you want to highlight. make sure the linenumber is counted in the code-part of the codeblock. so first line in your codepart is line 1 and so forth. you can enter multiple numbers separated by comma: `linehighlight=3,5,7` and also line-spans like 1-3: `linehighlight=3-6`
+++


+++layout:left
### speciallinemarker
if you have a lot of code or don't want to rely on fixed line-numbers because you may alter the number of lines of code you use for the presentation but want the same lines to be highlighted, you can make use of the speciallinemarker. it *"marks"* a line to be used as highlighted line. therefore you insert the speciallinemarker at the beginning of the target line:`§§ my special line`
with the option `speciallinemarker` you can define what signs should be interpreted as such markers. default is `§§`.
+++


+++layout:left
### specialstartmarker and specialendmarker
you want to highlight only a part of a line? you can do that by marking them as special with a start- and end-marker. the option `specialstartmarker` lets you define the syntax used for the beginning and `specialendmarker`the end of your marks.
defaults: `specialstartmarker=§(` and `specialendmarker=)§`
+++


---
## context-menu to the help

+++layout:left
you dont have to remember every option to use them. whenever your cursor is inside a code block you can use the context-menu on the left side of the textarea to help you out. it will insert the option at the right place, giving you hints how to use it. just press escape and try it for yourself.
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

the shorter the code, the most likely slidenotes will fail to detect the correct language. to make things easier for smaller codeblocks, where you dont want to add other options then the language, you can enter your language attached with a **:** to the header:
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

under the hood we use the awesome [highlight.js](https://highlightjs.org) library for adding a sweet syntax-highlightning to the code of the presentation. it supports more then 190 languages as for now, so fear not that your language is not supported. [^*]

we also facilitated the process of naming with aliases, so it does not matter if you write javascript, Javascript, JavaScript, Java-Script or just js... (or objective-c, ObjectiveC, Objective-C...)

our goal is to be as intuitive as possible: focus on the content, not on how to write it


[^*]:if you are still worried check out their [Demo page](https://highlightjs.org/static/demo) and see for yourself
---
#there's more!

we're constantly working on implementing more features and improving the ones we have.
if you have any suggestion—drop us a message under `options → feedback` or [hi@slidenotes.io](mailto:hi@slidenotes.io)
