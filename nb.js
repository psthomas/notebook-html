(function(factory) {

    // Find the global object for export to both the browser and web workers.
    var globalObject = typeof window === 'object' && window ||
                       typeof self === 'object' && self;

    // Setup nb.js for different environments. First is Node.js or
    // CommonJS.
    if (typeof exports !== 'undefined') {
        factory(exports);
    } else if (globalObject) {
        // Export nb globally even when using AMD for cases when this script
        // is loaded with others that may still expect a global nb.
        globalObject.nb = factory({});

        // Finally register the global nb with AMD.
        if (typeof define === 'function' && define.amd) {
            define([], function() {
                return globalObject.hljs;
            });
        }
    }

}(function(nb) {

    function ajax(myCallback, url) {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status === 200) {
                myCallback(req.responseText);  //This argument is the last one passed, following bound vars.
            }
        }
        return req.send();
    }

    function userAjax(myCallback, userCallback, url) {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status === 200) {
                var html = myCallback(req.responseText);  //This argument is the last one passed, following bound vars.
                userCallback(html); //Pass the html to the user's function
            }
        }
        return req.send();
    }

    //Simple markdown to html conversion
    //Source: https://github.com/p01/mmd.js/blob/master/mmd.js
    //MIT License: https://github.com/p01/mmd.js/blob/master/LICENSE
    function mmd(src){
        var h='';

        function escape(t){
            return new Option(t).innerHTML;
        }
        function inlineEscape(s){
            return escape(s)
                .replace(/!\[([^\]]*)]\(([^(]+)\)/g, '<img alt="$1" src="$2">')
                .replace(/\[([^\]]+)]\(([^(]+)\)/g, '$1'.link('$2'))
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        }

        src.replace(/^\s+|\r|\s+$/g, '')
        .replace(/\t/g, '    ')
        .split(/\n\n+/)
        .forEach(function(b, f, R){
            f=b[0];
            R=
            {
                '*':[/\n\* /,'<ul><li>','</li></ul>'],
                '1':[/\n[1-9]\d*\.? /,'<ol><li>','</li></ol>'],
                ' ':[/\n    /,'<pre><code>','</pre></code>','\n'],
                '>':[/\n> /,'<blockquote>','</blockquote>','\n']
            }[f];
            h+=
                R?R[1]+('\n'+b)
                    .split(R[0])
                    .slice(1)
                    .map(R[3]?escape:inlineEscape)
                    .join(R[3]||'</li>\n<li>')+R[2]:
                f=='#'?'<h'+(f=b.indexOf(' '))+'>'+inlineEscape(b.slice(f+1))+'</h'+f+'>':
                f=='<'?b:
                '<p>'+inlineEscape(b)+'</p>';
        });
        return h;
    };

    function handleCode(cell, settings) {
        var html = '';

        if (settings.code) {
            if (settings.codehighlighter === 'prettyprint') {
                //Including Google prettyprint:
                html += '<figure class="highlight"><pre><code class="prettyprint">' + cell.source.join('') + '</code></pre></figure>';
            } else {
                //Using highlight.js or no highlighting
                html += '<figure class="highlight"><pre><code>' + cell.source.join('') + '</code></pre></figure>';
            }
        }

        if (cell.hasOwnProperty('outputs')) {
            for (var i = 0; i<cell.outputs.length; i++) {
                //TODO: Investigate all cell properties to increase coverage
                if (cell.outputs[i].hasOwnProperty('data')) {
                    if (cell.outputs[i].data.hasOwnProperty('text/html')) {
                        //TODO: Is this 'text/html' label only used for table output?
                        html += settings.tables ? cell.outputs[i].data['text/html'].join(''): '';
                    } else if (cell.outputs[i].data.hasOwnProperty('image/png')) {
                        //Also could try if 'image' is in cell.outputs[i].data, then pass 
                        //the image type to the code below
                        //https://stackoverflow.com/questions/13950865
                        var base64Data = cell.outputs[i].data['image/png'];
                        var imageStr =  '<img src="data:image/png;base64,' + base64Data + '"/>'
                        html += settings.images ? imageStr : '';
                    } else if (cell.outputs[i].data.hasOwnProperty('text/plain')) {
                        html += '<pre>' + cell.outputs[i].data['text/plain'].join('') + '</pre>';
                    }
                } else if (cell.outputs[i].hasOwnProperty('text')) {
                    html += '<figure class="highlight"><pre>' + cell.outputs[i].text.join('') + '</pre></figure>';
                }
            }
        }

        //Replace all style tag instances?
        // var re = new RegExp('<style>(.*?)<\/style>', 'g') 
        // html = html.replace(re, ''); 
        if (!settings.tableoutline) {
            html = html.replace('border="1"', ''); //Eliminate all borders
        }
     
        return html;
    }

    function handleMarkdown(cell, i, settings) {

        //TODO: Originally wanted to be able to pass in a custom converter function
        //from showdown, others, but ran into issues with object scope of function
        if (typeof settings.mdconverter === 'object' && typeof showdown !== 'undefined') {
            //var converter = new showdown.Converter();
            var html = converter.makeHtml(cell.source.join(''));
        } else {
            //console.log('Using internal markdown converter.')
            var html = mmd(cell.source.join(''));
        }

        if (!settings.headline && i === 0) {
            //var re = new RegExp('<h1>(.*?)<\/h1>');
            //Replace only first instance, ,"g" for more
            //var re = new RegExp('<h1(.*?)<\/h1>');
            //Match any level first header
            var re = new RegExp('<h([0-9])(.*?)<\/h([0-9])>'); 
            html = html.replace(re, '');  
        }

        return html;
    }


    function simpleBuildHTML(settings, src) {

        var obj = JSON.parse(src);

        //TODO: Think about how to build the html without using strings, 
        //possibly dynamically inserting into DOM to load quicker:
        //https://stackoverflow.com/questions/494143
        var html = '';

        for (var i=0; i<obj.cells.length; i++) {
            var cell = obj.cells[i];
            switch (cell.cell_type) {
                case 'markdown':
                    html += handleMarkdown(cell, i, settings); 
                    break;
                case 'code':
                    html +=  handleCode(cell, settings);
                    break;
            }
        }

        return html;
    }

    function parseSettings(settings) {

        var defaultSettings = {
            'code': true,
            'markdown': true,
            'tables': true,
            'images': true,
            'headline': true,
            'tableoutline': false,
            'codehighlighter': 'none',
            'mdconverter': 'default'
        }; 

        //Overwrite defaults
        if (settings) {
            var keys = Object.keys(settings);
            for (var i=0; i<keys.length; i++) {
                defaultSettings[keys[i]] = settings[keys[i]];
            }
            settings = defaultSettings;

        } else {
            var settings = defaultSettings;
        }

        return settings;

    }

    function insertHTML(settings, id, src) {

        var html = simpleBuildHTML(settings, src);

        var el = document.getElementById(id);
        el.insertAdjacentHTML('beforeend', html);

        if (settings.codehighlighter === 'highlightjs' && typeof hljs !== 'undefined') {
            //http://highlightjs.readthedocs.io/en/latest/api.html
            //find a way to pass language configuration in?  Or just configure in optional callback:
            //hljs.configure({'languages':['python','javascript']});  
            hljs.initHighlighting();
        } else if (settings.codehighlighter === 'prettyprint' && typeof PR !== 'undefined') {
            PR.prettyPrint();
        }

    }

    function returnHTML(settings, src) {

        var html = simpleBuildHTML(settings, src);
        return html;
    }


    /* Public Functions */

    function returnNotebook(url, userCallback, settings) {

        settings = parseSettings(settings);

        //Short of using an synchronous call, the only other option
        //here is to take a callback from the user that allows them to
        //manipulate the resulting html string as needed.  
        userAjax(returnHTML.bind(null, settings), userCallback, url);

    }

    function insertNotebook(url, id, settings) {

        settings = parseSettings(settings);
        ajax(insertHTML.bind(null, settings, id), url);

    }

    // Set public functions:
    nb.returnNotebook = returnNotebook;
    nb.insertNotebook = insertNotebook;

    return nb;

}));