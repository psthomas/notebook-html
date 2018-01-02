# notebook.js

`.ipynb` -> `HTML`, in `JavaScript`

Render Jupyter Notebooks as HTML using JavaScript


## Motivation

I regularly use [Jupyter notebooks](https://jupyter.org/) for Python projects and often upload the results as GitHub repos or Gists.  My blog posts usually contain close to the same content as the Jupyter notebooks they're based on, so why not use the .ipynb file as the source?  This script allows me to upload a notebook, then access it and convert to HTML when my blog page loads.  That way, if I push new changes to the notebook code, my blog post will automatically update as well.  

## Usage

At it's most basic, this code is dependancy free.  Just load the script, and pass in the notebook url and an element id:

```html
<!doctype html>
<head>
<!-- your blog's styling here-->
</head>

<body>
<div id="notebook"> 
<!--Inserts Notebook HTML here-->
</div>

<!--load nb.js script-->
<script src="./nb.js"></script>

<script>
var id = 'notebook';
var url = 'https://raw.githubusercontent.com/psthomas/risk-return/master/returns.ipynb';
nb.insertNotebook(url, id);
</script>

</body>
</html>
```

The `insertNotebook` function can also take a settings object as an argument, with these defaults:

```javascript
//Using default settings:
var settings = {
    'code': true,              //Include code cells
    'markdown': true,          //Include markdown cells
    'tables': true,            //Include html data tables
    'images': true,            //Include .png outputs 
    'headline': false,         //Removes the first <h1> headline, useful if page has title already
    'tableoutline': false,     //Removes the black table outline
    'codehighlighter': 'none', //No code highlighting. Options: 'none', 'highlightjs', 'prettyprint'
    'mdconverter': 'default'   //Use included simple markdown converter.  Options: 'default', 'showdown'
};

var id = 'notebook';
var url = 'https://raw.githubusercontent.com/psthomas/risk-return/master/returns.ipynb';
nb.insertNotebook(url, id, settings);

```

If you want code highlighting, [highlightjs](https://github.com/isagalaev/highlight.js) and Google's [code-prettify](https://github.com/google/code-prettify) are options.  Load them via your preferred method, then pass in the correct setting.  Here's an example using `highlightjs`:

```html
<!--highlight.js-->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.12.0/build/styles/default.min.css">
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.12.0/build/highlight.min.js"></script>

<script>
var settings = {
    'codehighlighter': 'highlightjs'
}

var id = 'notebook';
var url = 'https://raw.githubusercontent.com/psthomas/risk-return/master/returns.ipynb';
nb.insertNotebook(url, id, settings);
</script>

```

The built-in markdown converter (courtesy of [mmd.js](https://github.com/p01/mmd.js/blob/master/mmd.js)) does a good job, but sometimes the markdown is too complicated.  In these cases, you can load [showdown.js](https://github.com/showdownjs/showdown) and pass it as a setting:

```html
<!--showdown.js-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/1.8.6/showdown.min.js"></script>

<script>
var settings = {
    'mdconverter': 'showdown'
}

var id = 'notebook';
var url = 'https://raw.githubusercontent.com/psthomas/risk-return/master/returns.ipynb';
nb.insertNotebook(url, id, settings);
</script>

```

If you'd prefer to manipulate the raw HTML string before inserting it manually, you can pass a callback function to the `returnNotebook` function.  For example, sometimes `highlightjs` doesn't correctly identify the language I'm using, so I can set some preferences and do the highlighting myself:

```javascript
var settings = {
    'mdconverter': 'showdown'
}

function highlightCallback(html) {

    //Manipulate, then insert html
    html = '<h1>Add a New Headline</h1>' + html;
    var el = document.getElementById('notebook');
    el.insertAdjacentHTML('beforeend', html);

    hljs.configure({'languages':['python','javascript']});
    hljs.initHighlighting();
}

var url = 'https://raw.githubusercontent.com/psthomas/risk-return/master/returns.ipynb';

nb.returnNotebook(url, highlightCallback, settings);

```

Note that the HTML initially won't have code highlighting if you return it as a string with returnNotebook, regardless of the settings you pass in.  

## TODO

This project is in it's early stages and I've mainly built it by testing it on my own notebooks -- it's by no means comprehensive.  Here are a few TODO items:

* Investigate all Jupyter cell types, all cell sources and outputs to increase coverage.  See [here](https://nbformat.readthedocs.io/en/latest/format_description.html#notebook-file-format) for cell types.    
* Build HTML without strings, possibly dynamically inserting into DOM to load quicker  
* Handle image types other than png 
* Figure out how to pass in custom markdown converter functions, not just use default ones  
* Maybe allow collapsing of cells, using reddit/hackernews style collapsing
* See if it's possible to use the Jupyter cell "collapsed" attribute to selectively exclude (or collapse) cells 

## License

MIT
 
  
