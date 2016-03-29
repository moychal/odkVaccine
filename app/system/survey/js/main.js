/* globals odkCommon */
/**
 * Simple boilerplate for defining the requirejs settings, 
 * to initialize parsequery dependencies, and to invoke
 * the parsequery.changeUrlHash to interpret the 
 * window.location.hash value.
 *
 * Also sets up a timer polling for the completion of the
 * jquery mobile platform. After it is initialized, the
 * timer then triggers the processing of the hash of the 
 * initial page load (which triggers the parsing and 
 * interpretation of the formDef.json for the form).
 */
requirejs.config({
    baseUrl: odkCommon.getBaseUrl(),
    waitSeconds: 45,
    paths: {
        // third-party libraries we depend upon 
        jquery : 'libs/jquery.1.10.2',
        bootstrap : 'libs/bootstrap-3.1.1-dist/js/bootstrap.min',
        moment : 'libs/eonasdan/moment',     
        datetimepicker : 'libs/eonasdan/bootstrap-datetimepicker',
        spinner : 'libs/spinner/waitMe.min',
        backbone : 'libs/backbone.1.0.0',
        handlebars : 'libs/handlebars.1.0.0.rc.4',
        underscore : 'libs/underscore.1.4.4',
        text : 'libs/text.2.0.10',
        //mobiscroll : 'libs/mobiscroll-2.5.4/js/combined.min',
        // directory paths for resources
        img : 'img',
        templates : 'survey/templates',
        translations : 'js/../../config/assets/framework/translations',
        // top-level objects
        screenTypes : 'survey/js/screenTypes',
        promptTypes : 'survey/js/promptTypes',
        // odkCommon.js -- stub directly loaded
        // odkData.js -- stub directly loaded
        // odkSurvey.js -- stub directly loaded
        // functionality
        screens : 'survey/js/screens',
        prompts : 'survey/js/prompts',
        database : 'survey/js/database',
        databaseUtils : 'survey/js/databaseUtils',
        controller : 'survey/js/controller',
        builder : 'survey/js/builder',
        screenManager : 'survey/js/screenManager',
        parsequery : 'survey/js/parsequery',
        opendatakit : 'survey/js/opendatakit',
        handlebarsHelpers : 'survey/js/handlebarsHelpers',
        formulaFunctions : 'survey/js/formulaFunctions',
        jqueryCsv : 'libs/jquery-csv/src/jquery.csv',
        XRegExp : 'libs/XRegExp-All-3.0.0-pre-2014-12-24',
        d3 : 'libs/d3-amd/d3',
        mockDbif: 'js/mock/mockDbif',
        mockImpl: 'js/mock/mockImpl',
        mockUtils: 'js/mock/mockUtils',
        mockSchema: 'js/mock/mockSchema',
        odkDataIf: 'js/mock/odkDataIf'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery'],
            exports: '$.fn'
        },
        'moment': {
            deps: [],
        },
        // datetimepicker already uses requirejs if it
        // is available so it doesn't need to be shimmed
        //'datetimepicker': {                      
        //    deps: ['jquery', 'bootstrap', 'moment'],
        //    exports: '$.fn.datetimepicker'
        //},
        'spinner': {                      
            deps: ['jquery'],
            exports: '$.fn.waitMe'
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
        'jqueryCsv' : {
            deps: ['jquery'],
            exports: '$.csv'
        },
        'd3' : {
            deps: [],
            exports: 'd3'
        }
    }
});

/**
 * This function is called by the Application Designer environment to trigger a 
 * re-draw of the current screen when returning from a linked table (sub-form).
 */
function redrawHook() {
    'use strict';
    require('controller').redrawHook();
}

/**
 * This function is the action for form tags that wrap input fields.
 * It seeks to change focus off of the currently-in-focus element and 
 * place the following object into focus.
 */
function odkLeaveField(theForm) {
    'use strict';
    /* Tabbing advances through the fields
     * provided there are tabindex attributes on them.
     * But hitting Enter, Next or Go does not.
     *
     * Try to make them behave similarly.
     *
     * The tabbing does not wrap, but we
     * will make Enter, Next or Go wrap.
     */
    var $fields = $('body > * [tabindex]');
    var $form = $(theForm);
    var $formField = $(theForm).find('* * [tabindex]').filter(':last');
    var idxFound = null;
    $fields.each(function(idx,domElement) {
        if ( $formField.is(domElement) ) {
            idxFound = idx;
            return false;
        }
        return true;
    });
    
    var $next;
    if ( idxFound !== null ) {
        $next = $fields.eq(idxFound+1);
    } else {
        $next = $fields.eq(0);
    }
    if ( $next !== null && $next !== undefined ) {
        $next.focus();
    }
}

/**
 * Test to confirm that all required dependencies have
 * been loaded. If there is a circular dependency, it will
 * be null. If so, log the error.
 */
function verifyLoad( prefix, alist, args ) {
    'use strict';
    var i;
    for ( i = 0 ; i < args.length ; ++i ) {
        if ( args[i] === undefined || args[i] === null ) {
            odkCommon.log('E',prefix + ' cyclic dependency prevented initialization of ' + alist[i]);
        }
    }
}

// Load XRegExp very early so that it is available when
// the JS stub implementation of odkCommon needs it.
require(['jquery','XRegExp'], 
    function($, XRegExp) {
        'use strict';
        verifyLoad('main.require.jquery',
            ['jquery','XRegExp'],
            [$, XRegExp]);

        odkCommon.log('I','main.require.jquery.loaded establish mobileinit action');

        require(['bootstrap','moment', 'odkDataIf'], 
            function(bootstrap, moment, odkDataIf) {
                verifyLoad('main.require.bootstrap.moment',
                    ['bootstrap','moment', 'odkDataIf'],
                    [bootstrap,   moment, odkDataIf]);
                odkCommon.log('I','main.require.bootstrap.moment.loaded establish mobileinit action');
                
            // and launch the framework...
            require([ 'spinner', 'opendatakit', 'database', 'parsequery',
                            'builder', 'controller', 'd3', 'jqueryCsv', 'datetimepicker'], 
            function(spinner,   opendatakit,   database,  parsequery,
                             builder,   controller,   d3,   jqueryCsv) {
                verifyLoad('main.require.framework.loaded',
                    ['datetimepicker', 'spinner', 'opendatakit', 'database','parsequery',
                            'builder', 'controller', 'd3', 'jqueryCsv'],
                    [ $.fn.datetimepicker,   spinner,   opendatakit,   database,  parsequery,
                             builder,   controller,   d3,   jqueryCsv]);

                
                // define a function that waits until jquery mobile is initialized
                // then calls changeUrlHash() to trigger loading and processing of
                // the requested form.
                    
                parsequery.initialize(controller,builder);

                var ref = window.location.href;
                var hashIdx = ref.indexOf("#");
                var searchIdx = ref.indexOf("?");
                var search = window.location.search;
                var newRef = ref;

                var ctxt = controller.newStartContext();

                var isAndroid = (opendatakit.getPlatformInfo().container === "Android");
                var testAndroidParsing = false;
                var remapUrl = !isAndroid;
                // TODO: figure out why jqMobile+Chrome adds an empty '?' search
                // string to window.location.href   Code deals with that here.
                // The ? catastrophically breaks Android 2.x
                if ( remapUrl ) {
                    if ( !(testAndroidParsing || isAndroid) ) {
                        if ( searchIdx < 0 || (hashIdx > 0 && searchIdx > hashIdx) ) {
                            // add it if it is missing
                            if ( hashIdx < 0 ) {
                                        newRef = ref + '?';
                            } else if ( hashIdx > 0 ) {
                                        newRef = ref.substring(0,hashIdx) + '?' + ref.substring(hashIdx,ref.length);
                            }
                            odkCommon.log('W','main.addEmptySearchTerm.reloadpage ref: ' + ref + ' newRef: ' + newRef);
                            window.location.assign(newRef);
                        } else if ( search !== undefined && search !== null && search.length > 0 ) {
                            // remove the non-empty search string and replace with ?
                            if ( hashIdx < 0 ) {
                                newRef = ref + '?';
                            } else if ( hashIdx > 0 ) {
                                newRef = ref.substring(0,hashIdx) + '?' + ref.substring(hashIdx,ref.length);
                            }
                            ctxt.log('W',"main.clearNonEmptySearchTerm.reloadpage ref: " + ref + ' newRef: ' + newRef);
                            window.location.assign(newRef);
                        } else {
                            ctxt.log('D','main.changeUrlHash ref: ' + ref);
                            parsequery.changeUrlHash(ctxt);
                        }
                    } else if ( searchIdx > 0 && (hashIdx < 0 || hashIdx > searchIdx) ) {
                        // we have a '?' on the URL. Forcibly remove it.
                        hashIdx = (hashIdx > 0) ? hashIdx : ref.length;
                        newRef = ref.substring(0,searchIdx) + ref.substring(hashIdx,ref.length);
                        odkCommon.log('W','main.removeUrlSearchTerm.reloadpage ref: ' + ref + ' newRef: ' + newRef );
                        window.location.assign(newRef);
                    } else {
                        // no search term -- pass through
                        ctxt.log('D','main.changeUrlHash ref: ' + ref);
                        parsequery.changeUrlHash(ctxt);
                    }
                } else {
                    // don't care -- do whatever...
                    ctxt.log('D','main.simple.changeUrlHash ref: ' + ref);
                    parsequery.changeUrlHash(ctxt);
                }
            }, function(err) {
                odkCommon.log('E','main.require.framework.errback: ' + err.requireType + ' modules: ' + err.requireModules.toString());
            });
    }, function(err) {
        odkCommon.log('E','main.require.bootstrap.moment.errback: ' + err.requireType + ' modules: ' + err.requireModules.toString());
    });
}, function(err) {
    odkCommon.log('E','main.require.jquery.errback: ' + err.requireType + ' modules: ' + err.requireModules.toString());
});
                         