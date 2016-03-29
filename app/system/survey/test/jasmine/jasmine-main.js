requirejs.config({
    baseUrl: odkCommon.getBaseUrl(),
    paths: {
        // third-party libraries we depend upon 
        jqmobile : 'libs/jquery.mobile-1.4.2/jquery.mobile-1.4.2',
        jquery : 'libs/jquery.1.10.2',
        backbone : 'libs/backbone.1.0.0',
        handlebars : 'libs/handlebars.1.0.0.rc.4',
        underscore : 'libs/underscore.1.4.4',
        text : 'libs/text.2.0.10',
        mobiscroll : 'libs/mobiscroll-2.5.4/js/combined.min',
        // directory paths for resources
        img : 'img',
        templates : 'templates',
        // top-level objects
        mdl : 'js/mdl',
        promptTypes : 'js/promptTypes',
        // odkCommon.js -- stub directly loaded
		// odkSurvey.js -- stub directly loaded
        // functionality
        prompts : 'js/prompts',
        database : 'js/database',
        controller : 'js/controller',
        builder : 'js/builder',
        screenManager : 'js/screenManager',
        parsequery : 'js/parsequery',
        opendatakit : 'js/opendatakit',
        jqmConfig : 'js/jqmConfig',
        handlebarsHelpers : 'js/handlebarsHelpers',
        formulaFunctions : 'js/formulaFunctions',
        'jquery-csv' : 'libs/jquery-csv/src/jquery.csv',
        jasmineTests : 'tests/jasmine/spec'
    },
    shim: {
        'jquery': {
            // Slimmer drop-in replacement for jquery
            //These script dependencies should be loaded before loading
            //zepto.js
            deps: [],
            //Once loaded, use the global '$' as the
            //module value.
            exports: '$'
        },
        'jqmobile': {
            // Slimmer drop-in replacement for jquery
            //These script dependencies should be loaded before loading
            //jqmobile.js
            deps: ['jquery', 'jqmConfig']
        },
        'underscore': {
            //These script dependencies should be loaded before loading
            //underscore.js
            deps: [],
            //Once loaded, use the global '_' as the
            //module value.
            exports: '_'
        },
        'backbone': {
            //These script dependencies should be loaded before loading
            //backbone.js
            deps: ['underscore', 'jquery'],
            //Once loaded, use the global 'Backbone' as the
            //module value.
            exports: 'Backbone'
        },
        'handlebars': {
            //These script dependencies should be loaded before loading
            //handlebars.js
            deps: ['jquery'],
            //Once loaded, use the global 'Handlebars' as the
            //module value.
            exports: 'Handlebars'
        },
        'mobiscroll': {
            deps: ['jquery']
        },
        'jquery-csv' : {
            deps: ['jquery']
        }
    }
});

requirejs([
    'jasmineTests/PromptsSpec',
    'jasmineTests/FormulaFunctionsSpec',
    'jasmineTests/BuilderSpec'
    ], 
function() {

          var jasmineEnv = jasmine.getEnv();
          jasmineEnv.updateInterval = 1000;
    
          var htmlReporter = new jasmine.HtmlReporter();
    
          jasmineEnv.addReporter(htmlReporter);
    
          jasmineEnv.specFilter = function(spec) {
            return htmlReporter.specFilter(spec);
          };
    
          var currentWindowOnload = window.onload;
    
          window.onload = function() {
            if (currentWindowOnload) {
              currentWindowOnload();
            }
            execJasmine();
          };
    
          function execJasmine() {
            jasmineEnv.execute();
          }
});
