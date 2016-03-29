/* global odkCommon, odkSurvey */
/**
 * Manages the execution state and screen history of the overall survey, 
 * including form validation, saving and marking the form as 'complete'.
 *
 * Delegates the display of individual screens to the screenManager. 
 * On page advance, asks the screen manager whether advancing off the
 * screen is allowed. 
 *
 * Delegates the evaluation of individual constraints, etc. to the 
 * screens and thereby to the prompts within those screens.
 *
 */
define(['screenManager','opendatakit','database', 'parsequery', 'jquery','underscore' ],
function(ScreenManager,  opendatakit,  database,   parsequery,  $,        _ ) {
'use strict';
verifyLoad('controller',
    ['screenManager','opendatakit','database', 'parsequery', 'jquery','underscore' ],
    [ScreenManager,  opendatakit,  database,    parsequery,  $,        _]);
return {
    eventCount: 0,
    moveFailureMessage: { message: "Internal Error: Unable to determine next prompt." },
    screenManager : null,
    viewFirstQueuedAction: function() {
        var action = odkCommon.viewFirstQueuedAction();
        if ( action === undefined ) return null;
        return action;
    },
    removeFirstQueuedAction: function() {
        odkCommon.removeFirstQueuedAction();
    },
    getCurrentScreenPath: function() {
        var path = odkSurvey.getScreenPath(opendatakit.getRefId());
        if ( path === undefined ) return null;
        return path;
    },
    getCurrentContentsScreenPath: function() {
        var currentPath = this.getCurrentScreenPath();
        if ( currentPath === null ) {
            odkCommon.log('E',"controller.getCurrentContentsScreenPath: null currentScreenPath!");
            return null;
        }
        var parts = currentPath.split("/");
        if ( parts.length < 2 ) {
            odkCommon.log('E',"controller.getCurrentContentsScreenPath: invalid currentScreenPath: " + currentPath);
            return null;
        }
 
        return parts[0] + '/_contents';
    },
    getOperationPath: function(opPath) {
        
        if ( opPath === undefined || opPath === null ) {
            odkCommon.log('E',"invalid opPath: null");
            return null;
        }
        
        var parts = opPath.split("/");
        if ( parts.length < 2 ) {
            odkCommon.log('E',"controller.getOperationPath: invalid opPath: " + opPath);
            return null;
        }
        
        var formDef = opendatakit.getCurrentFormDef();
        var section = formDef.specification.sections[parts[0]];
        if ( section === undefined || section === null ) {
            odkCommon.log('E',"controller.getOperationPath: no section matching opPath: " + opPath);
            return null;
        }

        var intRegex = /^\d+$/;
        var intIndex;
        if(intRegex.test(parts[1])) {
            intIndex = parseInt(parts[1], 10);
        } else {
            intIndex = section.branch_label_map[parts[1]];
        }

        if ( intIndex === undefined || intIndex === null ) {
            odkCommon.log('E',"controller.getOperationPath: no branch label matching opPath: " + opPath);
            return null;
        }

        if ( intIndex >= section.operations.length ) {
            odkCommon.log('E',"controller.getOperationPath: invalid opPath (beyond end of operations array): " + opPath);
            return null;
        }
        
        var newPath = parts[0] + '/' + intIndex;
        return newPath;
    },
    getNextOperationPath: function(opPath) {
        
        if ( opPath === undefined || opPath === null ) {
            odkCommon.log('E',"invalid opPath: null");
            return null;
        }
        
        var parts = opPath.split("/");
        if ( parts.length < 2 ) {
            odkCommon.log('E',"controller.getNextOperationPath: invalid opPath: " + opPath);
            return null;
        }
        
        var formDef = opendatakit.getCurrentFormDef();
        var section = formDef.specification.sections[parts[0]];
        if ( section === undefined || section === null ) {
            odkCommon.log('E',"controller.getNextOperationPath: no section matching opPath: " + opPath);
            return null;
        }

        var intRegex = /^\d+$/;
        var intIndex;
        if(intRegex.test(parts[1])) {
            intIndex = parseInt(parts[1], 10);
        } else {
            intIndex = section.branch_label_map[parts[1]];
        }

        if ( intIndex === undefined || intIndex === null ) {
            odkCommon.log('E',"controller.getNextOperationPath: no branch label matching opPath: " + opPath);
            return null;
        }

        if ( intIndex >= section.operations.length ) {
            odkCommon.log('E',"controller.getNextOperationPath: invalid opPath (beyond end of operations array): " + opPath);
            return null;
        }
        
        intIndex++;
        var newPath = parts[0] + '/' + intIndex;

        if ( intIndex >= section.operations.length ) {
            odkCommon.log('E',"controller.getNextOperationPath: advancing beyond end of operations array: " + newPath);
            return null;
        }
        
        return newPath;
    },
    getOperation: function(opPath) {
        if ( opPath === undefined || opPath === null ) {
            odkCommon.log('E',"invalid opPath: null");
            return null;
        }
        
        var parts = opPath.split("/");
        if ( parts.length < 2 ) {
            odkCommon.log('E',"controller.getOperation: invalid opPath: " + opPath);
            return null;
        }
        
        var formDef = opendatakit.getCurrentFormDef();
        var section = formDef.specification.sections[parts[0]];
        if ( section === undefined || section === null ) {
            odkCommon.log('E',"controller.getOperation: no section matching opPath: " + opPath);
            return null;
        }
        var intRegex = /^\d+$/;
        var intIndex;
        if(intRegex.test(parts[1])) {
            intIndex = parseInt(parts[1], 10);
        } else {
            intIndex = section.branch_label_map[parts[1]];
        }

        if ( intIndex === undefined || intIndex === null ) {
            odkCommon.log('E',"controller.getOperation: no branch label matching opPath: " + opPath);
            return null;
        }

        if ( intIndex >= section.operations.length ) {
            odkCommon.log('E',"controller.getOperation: invalid opPath (beyond end of operations array): " + opPath);
            return null;
        }
        var op = section.operations[intIndex];
        if ( op === undefined ) return null;
        return op;
    },
    getCurrentSectionPrompts: function() {
        var opPath = this.getCurrentScreenPath();
        
        if ( opPath === null ) {
            return [];
        }
        
        var parts = opPath.split("/");
        if ( parts.length < 2 ) {
            return [];
        }
        
        var formDef = opendatakit.getCurrentFormDef();
        var section = formDef.specification.sections[parts[0]];
        if ( section === undefined || section === null ) {
            return [];
        }
        
        return section.parsed_prompts;
    },
    getPrompt: function(promptPath) {
        if ( promptPath === undefined || promptPath === null ) {
            odkCommon.log('E',"invalid promptPath: null");
            return null;
        }
        
        var parts = promptPath.split("/");
        if ( parts.length < 2 ) {
            odkCommon.log('E',"controller.getPrompt: invalid promptPath: " + promptPath);
            return null;
        }
        
        var formDef = opendatakit.getCurrentFormDef();
        var section = formDef.specification.sections[parts[0]];
        if ( section === undefined || section === null ) {
            odkCommon.log('E',"controller.getPrompt: no section matching promptPath: " + promptPath);
            return null;
        }
        var intRegex = /^\d+$/;
        var intIndex;
        if(intRegex.test(parts[1])) {
            intIndex = parseInt(parts[1], 10);
        }

        if ( intIndex === undefined || intIndex === null ) {
            odkCommon.log('E',"controller.getPrompt: no branch label matching promptPath: " + promptPath);
            return null;
        }

        if ( intIndex >= section.parsed_prompts.length ) {
            odkCommon.log('E',"controller.getPrompt: invalid promptPath (beyond end of operations array): " + promptPath);
            return null;
        }
        var prompt = section.parsed_prompts[intIndex];
        return prompt;
    },
    findPreviousScreenAndState: function(isResume) {
        var that = this;
        var path = null;
        var state = null;
        var repop = false;
        var clearState = true;
        var oldScreenPath = that.getCurrentScreenPath();
        while (odkSurvey.hasScreenHistory(opendatakit.getRefId())) {
            clearState = false;
            path = odkSurvey.popScreenHistory(opendatakit.getRefId());
            state = odkSurvey.getControllerState(opendatakit.getRefId());
            // possible 'state' values:
            // advanceOnReturn
            // hideInBackHistory
            // popHistoryOnExit -- awkward
            // validateinProgress -- awkward
            //
            // the later two are possible if a validation constraint 
            // shared a screen with a user-directed branch and the 
            // user took the branch rather than fix the validation
            // failure.
            // 
            // It is safe to back over the popHistoryOnExit, as 
            // that is the screen that failed validation.
            // 
            // It also makes sense to back over the validation 
            // command (which will always have validateInProgress
            // state), as it doesn't have any UI on success.
            //
            if ( state === 'hideInBackHistory' || 
                 state === 'validateInProgress' || 
                 state === 'popHistoryOnExit' ) {
                // this is a hidden screen w.r.t. the back history
                // skip over it.
                continue;
            } else if ( state !== 'advanceOnReturn' ) {
                // this is not a do section action. 
                // show it.
                break;
            } else {
                // this IS a do section action.
                // if we started in a different section than 
                // the one we are in now, then we are backing out
                // of a subsection. In that case, we should show
                // the contents screen of the section we are 
                // re-entering.
                var newScreenPath = that.getCurrentScreenPath();
                if ( oldScreenPath !== null &&  oldScreenPath !== undefined &&
                     newScreenPath !== null && newScreenPath !== undefined ) {
                    var oldParts = oldScreenPath.split("/");
                    var newParts = newScreenPath.split("/");
                    if ( oldParts[0] != newParts[0] ) {
                        // we are popping up.
                        // retain the do section clause in the 
                        // history record (since we are backing
                        // up, this will not be done on the screen
                        // transition, so we must do that here).
                        // and show the contents screen.
                        // When we advance forward from 
                        // the contents screen we will resume
                        // at the statement after the do section.
                        // If we go backward, we will silently
                        // clear this record out and move to the 
                        // screen before the do section.
                        odkSurvey.pushSectionScreenState(opendatakit.getRefId());
                        path = that.getCurrentContentsScreenPath();
                        state = '';
                        repop = true;
                        break;
                    }
                }
                // Otherwise, we are in the same section.
                // If isResume is true, then we want to stop
                // at this point. Otherwise, we want to move
                // back through to an earlier screen in this 
                // same section.
                if ( isResume ) {
                    break;
                }
                // clear the state unless we can pop off...
                clearState = true;
            }
        }
        if ( clearState ) {
            state = '';
        }
        return { path: path, state: state, repop: repop};
    },
    beforeMove: function(isStrict, advancing){
        var that = this;
        if ( that.screenManager ) {
            try {
                var validateOnAdvance = ! opendatakit.getSettingValue('deferValidationUntilFinalize');
                return that.screenManager.beforeMove(isStrict, advancing, advancing && validateOnAdvance);
            } catch(ex) {
                var opPath = that.getCurrentScreenPath();
                odkCommon.log('E','controller.beforeMove.exception ' + ex.message + " stack: " + ex.stack  + " px: " + opPath);
                return {message: "Exception while advancing to next screen. " + ex.message};
            }
        } else {
            return null;
        }
    },
    /**
     *********************************************************************
     *********************************************************************
     *********************************************************************
     * Asynchronous interactions
     *********************************************************************
     *********************************************************************
     *********************************************************************
     */
    // NOTE: this is only here to avoid having screen depend upon database.
    commitChanges: function(ctxt) {
        ctxt.log('D','controller.commitChanges applying deferred changes');
        database.applyDeferredChanges(ctxt);
    },
    /**
     * Get 'op' at 'path'. If it is anything but a 'begin_screen', we 
     * step through and process it, until we land on a 'begin_screen'
     * operation.
     *
     * pass the 'begin_screen' operation into the ctxt success callback.
     */
    _doActionAtLoop: function(ctxt, inOp, inAction) {
        var that = this;
        // NOTE: copy arguments into local variables
        // so that the Chrome debugger will show the 
        // current values of these variables as the 
        // loop below progresses.
        //
        var op = inOp;
        var action = inAction;
        var path = null;
        var state = '';
        var combo;
        if ( action === null || action === undefined ) {
            action = op._token_type;
        }
        for (;;) {
            path = op._section_name + "/" + op.operationIdx;
            ctxt.log('I','controller._doActionAtLoop: path: ' + path + ' action: ' + action);
            try {
                switch ( action ) {
                case "goto_label":
                    // jump to a label. This may be conditional...
                    // i.e., The 'condition' property is now a boolean predicate
                    // (it is compiled into one during the builder's processing 
                    // of the form). If it evaluates to false, then skip to the
                    // next question; if it evaluates to true or is not present, 
                    // then execute the 'goto'
                    if('condition' in op && !op.condition()) {
                        path = that.getNextOperationPath(path);
                    } else {
                        path = that.getOperationPath(op._section_name + "/" + op._branch_label);
                    }
                    break;
                case "assign":
                    // do an assignment statement.
                    // defer the database update until we reach a screen.
                    database.setValueDeferredChange(op.name, op.calculation());
                    // advance to the next operation.
                    path = that.getNextOperationPath(path);
                    break;
                case "advance":
                    state = odkSurvey.getControllerState(opendatakit.getRefId());
                    if ( state !== 'popHistoryOnExit' ) {
                        path = that.getNextOperationPath(path);
                        break;
                    }
                    // otherwise drop through...
                case "back_in_history":
                    // pop the history stack, and render that screen.
                    combo = that.findPreviousScreenAndState(false);
                    path = combo.path;
                    state = combo.state;

                    if ( path === null || path === undefined ) {
                        path = opendatakit.initialScreenPath;
                    }
                    // just for debugging...
                    odkSurvey.getScreenPath(opendatakit.getRefId());
                    break;
                case "resume":
                    // pop the history stack, and render the next screen.
                    combo = that.findPreviousScreenAndState(true);
                    path = combo.path;
                    state = ''; // reset this, since we want to advance
                    if ( path === null || path === undefined ) {
                        path = opendatakit.initialScreenPath;
                    } else if ( !combo.repop ) {
                       path = that.getNextOperationPath(path);
                    }
                    // just for debugging...
                    odkSurvey.getScreenPath(opendatakit.getRefId());
                    break;
                case "do_section":
                    // save our op...
                    odkSurvey.setSectionScreenState(opendatakit.getRefId(), path, 'advanceOnReturn');
                    // start at operation 0 in the new section
                    path = op._do_section_name + "/0";
                    break;
                case "exit_section":
                    path = odkSurvey.popSectionStack(opendatakit.getRefId());
                    if ( odkSurvey.getControllerState(opendatakit.getRefId()) === 'advanceOnReturn' ) {
                        path = that.getNextOperationPath(path);
                    }
                    if ( path === null || path === undefined ) {
                        path = opendatakit.initialScreenPath;
                    }
                    break;
                case "save_and_terminate":
                    var complete = ('calculation' in op) ? op.calculation() : false;
                    var siformId = opendatakit.getSettingValue('form_id');
                    var simodel = opendatakit.getCurrentModel();
                    var siinstanceId = opendatakit.getCurrentInstanceId();
                    that._innerSaveAllChanges(ctxt, op, path, simodel, siformId, siinstanceId, complete);
                    return;
                case "validate":
                    var validationTag = op._sweep_name;
                    
                    if ( odkSurvey.getScreenPath(opendatakit.getRefId()) !== path ||
                         odkSurvey.getControllerState(opendatakit.getRefId()) !== 'validateInProgress' ) {
                        // tag this op as a 'validateInProgress' node. Push onto stack.
                        odkSurvey.setSectionScreenState( opendatakit.getRefId(), op._section_name + "/" + op.operationIdx, 'validateInProgress');
                        odkSurvey.pushSectionScreenState( opendatakit.getRefId());
                    }
                    
                    that._innerValidate(ctxt, op, validationTag);
                    return;
                case "begin_screen":
                    ctxt.success(op);
                    return;
                default:
                    ctxt.failure({message: "Unrecognized action in doAction loop: " + action });
                    return;
                }
                
                //
                // advance to the 'op' specified by the path.
                if ( path !== null &&  path !== undefined ) {
                    op = that.getOperation(path);
                    action = op._token_type;
                } else {
                    odkCommon.log('E',"controller._doActionAtLoop.failure px: " + path);
                    ctxt.failure(that.moveFailureMessage);
                    return;
                }
                
            } catch (e) {
                odkCommon.log('E', "controller._doActionAtLoop.exception px: " +
                                path + ' exception: ' + String(e));
                var mf = _.extend({}, that.moveFailureMessage);
                mf.message = mf.message + ' ' + e.message;
                ctxt.failure(mf);
                return;
            }
        }
    },
    /** 
     * Pulled out of loop to prevent looping variable issues (jsHint)
     */
    _innerSaveAllChanges: function(ctxt, op, path, simodel, siformId, siinstanceId, complete) {
        var that = this;
        database.save_all_changes($.extend({},ctxt,{success:function() {
                that.screenManager.hideSpinnerOverlay();
                odkSurvey.saveAllChangesCompleted( opendatakit.getRefId(), opendatakit.getCurrentInstanceId(), complete);
                // the odkSurvey should terminate the window... if not, at least leave the instance.
                that.leaveInstance(ctxt);
            },
            failure:function(m) {
                odkSurvey.saveAllChangesFailed( opendatakit.getRefId(), opendatakit.getCurrentInstanceId());
                // advance to next operation if we fail...
                path = that.getNextOperationPath(path);
                op = that.getOperation(path);
                if ( op !== undefined && op !== null ) {
                    that._doActionAtLoop(ctxt, op, op._token_type );
                } else {
                    ctxt.failure(that.moveFailureMessage);
                }
            }}), simodel, siformId, siinstanceId, complete);
    },
    /** 
     * Pulled out of loop to prevent looping variable issues (jsHint)
     */
    _innerValidate:function(ctxt, op, validationTag) {
        var that = this;
        database.applyDeferredChanges($.extend({},ctxt,{
        success:function() {
            var vctxt = $.extend({},ctxt,{
                success:function(operation, options, m) {
                    if ( operation === undefined || operation === null ) {
                        // validation is DONE: pop ourselves off return stack.
                        var refPath = odkSurvey.popScreenHistory( opendatakit.getRefId());
                        if ( refPath != op._section_name + "/" + op.operationIdx ) {
                            ctxt.log('E',"unexpected mis-match of screen history states");
                            ctxt.failure(that.moveFailureMessage);
                            return;
                        }
                        that._doActionAtLoop(ctxt, op, 'advance' );
                    } else {
                        ctxt.success(operation, options, m);
                    }
                }});
            /**
             * Upon exit:
             *   ctxt.success() -- for every prompt associated with this validationTag, 
             *                     if required() evaluates to true, then the field has a value
             *                     and if constraint() is defined, it also evaluates to true.
             *
             *   ctxt.failure(m) -- if there is a failed prompt, then:
             *                     setScreen(prompt, {popHistoryOnExit: true})
             *                      and always:
             *                     chainedCtxt to display showScreenPopup(m) after a 500ms delay.
             */
            var formDef = opendatakit.getCurrentFormDef();
            var section_names = formDef.specification.section_names;
            var i, j;
            var promptList = [];
            for ( i = 0 ; i < section_names.length ; ++i ) {
                var sectionName = section_names[i];
                var section = formDef.specification.sections[sectionName];
                var tagList = section.validation_tag_map[validationTag];
                if ( tagList !== undefined && tagList !== null ) {
                    for ( j = 0 ; j < tagList.length ; ++j ) {
                        promptList.push(sectionName + "/" + tagList[j]);
                    }
                }
            }
            if ( promptList.length === 0 ) {
                vctxt.log('D',"validateQuestionHelper.success.emptyValidationList");
                vctxt.success();
                return;
            }
            
            // start our work -- display the 'validating...' spinner
            that.screenManager.showSpinnerOverlay({text:"Validating..."});
          
            var buildRenderDoneCtxt = $.extend({render: false}, vctxt, {
                success: function() {
                    // all render contexts have been refreshed
                    var currPrompt;
                    var validateError;
                    for ( var i = 0; i < promptList.length; i++ ) {
                        currPrompt = that.getPrompt(promptList[i]);
                        validateError = currPrompt._isValid(true);
                        if ( validateError !== undefined && validateError !== null ) {
                            vctxt.log('I',"_validateQuestionHelper.validate.failure", "px: " + currPrompt.promptIdx);
                            var nextOp = that.getOperation(currPrompt._branch_label_enclosing_screen);
                            if ( nextOp === null ) {
                                vctxt.failure(that.moveFailureMessage);
                                return;
                            }
                            vctxt.success(nextOp, {popHistoryOnExit: true}, validateError);
                            return;
                        }
                    }
                    vctxt.log('D',"validateQuestionHelper.success.endOfValidationList");
                    vctxt.success();
                },
                failure: function(m) {
                    vctxt.failure(m);
                }
            });

            var buildRenderDoneOnceCtxt = $.extend({render: false}, buildRenderDoneCtxt, {
                success: _.after(promptList.length, function() {
                    buildRenderDoneCtxt.success();
                }),
                failure: _.once(function(m) {
                    buildRenderDoneCtxt.failure(m);
                })
            });

            if ( promptList.length === 0 ) {
                buildRenderDoneCtxt.success();
            } else {
                // refresh all render contexts (they may have constraint values
                // that could have changed -- e.g., filtered choice lists).
                $.each( promptList, function(idx, promptCandidatePath) {
                    var promptCandidate = that.getPrompt(promptCandidatePath);
                    promptCandidate.buildRenderContext(buildRenderDoneOnceCtxt);
                });
            }
        }}));

    },
    setScreenWithMessagePopup:function(ctxt, op, options, m) {
        var that = this;
        var opPath = op._section_name + "/" + op.operationIdx;
        /**
         * If we immediately display the message pop-up, it might be cancelled during the page rendering.
         * Therefore, wait 500ms before attempting to show the message pop-up.
         * 
         * Do this using a chained context...
         */
        var popupbasectxt = that.newCallbackContext();
        var popupctxt = $.extend({}, popupbasectxt, {
            success: function() {
                popupbasectxt.log('D',"setScreenWithMessagePopup.popupSuccess.showScreenPopup", "px: " + opPath);
                if ( m && m.message ) {
                    popupbasectxt.log('D',"setScreenWithMessagePopup.popupSuccess.showScreenPopup", "px: " + opPath + " message: " + m.message);
                    // schedule a timer to show the message after the page has rendered
                    that.screenManager.showScreenPopup(m);
                }
                popupbasectxt.success();
            },
            failure: function(m2) {
                popupbasectxt.log('D',"setScreenWithMessagePopup.popupFailure.showScreenPopup", "px: " + opPath);
                // NOTE: if the setScreen() call failed, we should show the error from that...
                if ( m2 && m2.message ) {
                    popupbasectxt.log('D',"setScreenWithMessagePopup.popupFailure.showScreenPopup", "px: " + opPath + " message: " + m2.message);
                    // schedule a timer to show the mesage after the page has rendered
                    that.screenManager.showScreenPopup(m2);
                }
                popupbasectxt.success();
        }});

        ctxt.setChainedContext(popupctxt);
        /**
         * And now display the requested screen.
         */
        that.setScreen( $.extend({}, ctxt, {
                success: function() {
                    that.screenManager.hideSpinnerOverlay();
                    ctxt.success();
                }, 
                failure: function(m3) {
                    that.screenManager.hideSpinnerOverlay();
                    ctxt.failure(m3);
                }}), op, options );
    },
    _doActionAt:function(ctxt, op, action, popStateOnFailure) {
        var that = this;
        var currentScreenPath = that.getCurrentScreenPath();
        if ( op === null ) {
            throw Error("controller._doActionAt.nullOp unexpected condition -- caller should handle this!");
        }
        
        try {
            // any deferred database updates will be written via the setScreen call.
            var newctxt = $.extend({},ctxt,{
                success:function(operation, options, m) {
                    if(operation) {
                        ctxt.log('D',"controller._doActionAt._doActionAtLoop.success", "px: " + that.getCurrentScreenPath() + " nextPx: " + operation.operationIdx);
                        that.setScreenWithMessagePopup(ctxt, operation, options, m);
                    } else {
                        ctxt.log('D',"controller._doActionAt._doActionAtLoop.success", "px: " + that.getCurrentScreenPath() + " nextPx: no screen!");
                        // do nothing -- the action already is showing the appropriate screen.
                        ctxt.success();
                    }
                }, failure:function(m) {
                    if ( popStateOnFailure ) {
                        odkSurvey.popScreenHistory(opendatakit.getRefId());
                    }
                    if ( that.getCurrentScreenPath() !== currentScreenPath ) {
                        ctxt.log('W',"controller._doActionAt._doActionAtLoop.failure", "px: " + 
                            that.getCurrentScreenPath() + " does not match starting screen: " + currentScreenPath);
                    }
                    var op = that.getOperation(currentScreenPath);
                    if (op === null) {
                        ctxt.failure(that.moveFailureMessage);
                    } else {
                        that.setScreenWithMessagePopup( ctxt, op, null, m);
                    }
            }});
            that._doActionAtLoop( newctxt, op, action);
        } catch (e) {
            console.error("controller._doActionAt.exception: " + String(e));
            ctxt.failure({message: "Possible goto loop."});
        }
    },
    /**
     * used by Application Designer environment. see main.js redrawHook() function.
     */
    redrawHook: function() {
        var ctxt = this.newCallbackContext();
        var path = this.getCurrentScreenPath();
        var operation = this.getOperation(path);
        this.setScreen(ctxt, operation);
    },
    setScreen: function(ctxt, operation, inOptions){
        var that = this;
        ctxt.log('D','controller.setScreen', "nextPx: " + operation.operationIdx);
        var options = (inOptions === undefined || inOptions === null) ? {} : inOptions;

        /**
         * Valid options:
         *  changeLocale: true/false
         *  popHistoryOnExit: true/false
         */
        var newPath = that.getOperationPath(operation._section_name + "/" + operation.operationIdx);
        if ( newPath === null ) {
            ctxt.failure(that.moveFailureMessage);
            return;
        }
        
        var stateString = null;
        
        var oldPath = that.getCurrentScreenPath();
        if ( oldPath === newPath ) {
            // redrawing -- take whatever was already there...
            stateString = odkSurvey.getControllerState(opendatakit.getRefId());
        }
        
        if ( options.popHistoryOnExit ) {
            stateString = 'popHistoryOnExit';
        } else if ( operation.screen && operation.screen.hideInBackHistory ) {
            stateString = 'hideInBackHistory';
        }
        
        odkSurvey.setSectionScreenState( opendatakit.getRefId(), newPath, stateString);
        // Build a new Screen object so that jQuery Mobile is always happy...
        var formDef = opendatakit.getCurrentFormDef();
        var screen_attrs = operation.screen;
        var screen_type = 'screen';
        var ScreenType, ExtendedScreenType, ScreenInstance;
        if (screen_attrs !== null && screen_attrs !== undefined && ('screen_type' in screen_attrs)) {
            screen_type = screen_attrs.screen_type;
        }
        
        if (!(screen_type in formDef.specification.currentScreenTypes)) {
            ctxt.log('E','controller.setScreen.unrecognizedScreenType', screen_type);
            ctxt.failure({message: 'unknown screen_type'});
            return;
        }
        
        ScreenType = formDef.specification.currentScreenTypes[screen_type];
        ExtendedScreenType = ScreenType.extend(screen_attrs);
        ScreenInstance = new ExtendedScreenType({ _section_name: operation._section_name, _operation: operation });

        that.screenManager.setScreen($.extend({},ctxt,{
            success: function() {
                var qpl = opendatakit.getSameRefIdHashString(opendatakit.getCurrentFormPath(), 
                            opendatakit.getCurrentInstanceId(), that.getCurrentScreenPath());
                window.location.hash = qpl;
                ctxt.success();
            }, failure: function(m) {
            /////////////////////
            // TODO: reconcile this with _doActionAt failure -- 
            // one or the other should pop the stack.
            // How does this flow?
                // undo screen change on failure...
                ctxt.log('D','controller.setScreen.failureRecovery', 'hash: ' + window.location.hash);
                if ( oldPath == newPath ) {
                    ctxt.failure(m);
                } else {
                    // set the screen back to what it was, then report this failure
                    var op = that.getOperation(oldPath);
                    if ( op !== null ) {
                        that.setScreen($.extend({},ctxt,{success:function() {
                            // report the failure.
                            ctxt.failure(m);
                        }, failure: function(m2) {
                            // report the failure.
                            ctxt.failure(m);
                        }}), op);
                    } else {
                        ctxt.failure(m);
                    }
                }
            }}), ScreenInstance, options.popHistoryOnExit || false );
    },
    /**
     * Move to the previous event in the screenHistory.
     * This is generally the previous screen, but might 
     * be an intermediate non-visible action node (e.g., 
     * do_section or validate) in which case we go back 
     * to that node and either advance forward from it
     * (do_section) or re-execute it (validate).
     *
     * Success: we have successfully advanced to a new
     *   screen.
     * Failure: we were unable to advance. In general, 
     *   this means we stay where we are.
     */
    gotoPreviousScreen: function(ctxt){
        var that = this;
        ctxt.log('D','controller.gotoPreviousScreen');
        var opPath = that.getCurrentScreenPath();
        
        var failureObject = that.beforeMove(true, false);
        if ( failureObject !== null && failureObject !== undefined ) {
            ctxt.log('I',"gotoPreviousScreen.beforeMove.failure", "px: " +  opPath);
            that.screenManager.showScreenPopup(failureObject); 
            ctxt.failure(failureObject);
            return;
        }

        ctxt.log('D',"gotoPreviousScreen.beforeMove.success", "px: " +  opPath);
        var op = that.getOperation(opPath);
        if ( op === null ) {
            ctxt.failure(that.moveFailureMessage);
            return;
        }
        that._doActionAt(ctxt, op, 'back_in_history', false);
    },
    /*
     * Advance foward in the form from this position.
     *
     * Success: we have successfully advanced to a new
     *   screen.
     * Failure: we were unable to advance. In general, 
     *   this means we stay where we are.
     */
    gotoNextScreen: function(ctxt){
        var that = this;
        ctxt.log('D','controller.gotoNextScreen');
        var opPath = that.getCurrentScreenPath();

        var failureObject = that.beforeMove(true, true);
        if ( failureObject !== null && failureObject !== undefined ) {
            ctxt.log('I',"gotoNextScreen.beforeMove.failure", "px: " +  opPath);
            that.screenManager.showScreenPopup(failureObject); 
            ctxt.failure(failureObject);
            return;
        }

        ctxt.log('D',"gotoNextScreen.beforeMove.success", "px: " +  opPath);
        var op = that.getOperation(opPath);
        if ( op === null ) {
            ctxt.failure(that.moveFailureMessage);
            return;
        }
        var stateString = odkSurvey.getControllerState(opendatakit.getRefId());
        var popHistoryOnExit = ( stateString === 'popHistoryOnExit' );
        // if the current screen is supposed to be popped from the stack
        // when we advance off of it, then do not push it onto the stack!
        if ( !popHistoryOnExit ) {
            odkSurvey.pushSectionScreenState(opendatakit.getRefId());
        }
        that._doActionAt(ctxt, op, 'advance', !popHistoryOnExit);
    },
    /*
     * Display the contents screen.
     *
     * Success: we have successfully navigated to the 
     *   contents screen.
     * Failure: we were unable to advance. In general, 
     *   this means we stay where we are.
     */
    gotoContentsScreen: function(ctxt){
        var that = this;
        ctxt.log('D','controller.gotoContentsScreen');
        var opPath = that.getCurrentScreenPath();

        var failureObject = that.beforeMove(true, false);
        if ( failureObject !== null && failureObject !== undefined ) {
            ctxt.log('I',"gotoContentsScreen.beforeMove.failure", "px: " +  opPath);
            that.screenManager.showScreenPopup(failureObject); 
            ctxt.failure(failureObject);
            return;
        }

        ctxt.log('D',"gotoContentsScreen.beforeMove.success", "px: " +  opPath);
        var op = that.getOperation( that.getCurrentContentsScreenPath() );
        if ( op === null ) {
            ctxt.failure(that.moveFailureMessage);
            return;
        }
        odkSurvey.pushSectionScreenState(opendatakit.getRefId());
        that._doActionAt(ctxt, op, op._token_type, true);
    },
    /*
     * Begin the 'validate finalize' and 'save_and_terminate true'
     * actions. 
     *
     * Success: we have successfully navigated to either
     *   a screen where there is a validation failure
     *   or we have executed the save_and_terminate action.
     *
     * Failure: we were unable to advance. In general, 
     *   this means we stay where we are.
     */
    gotoFinalizeAndTerminateAction: function(ctxt){
        var that = this;
        ctxt.log('D','controller.gotoFinalizeAction');
        var opPath = that.getCurrentScreenPath();

        var failureObject = that.beforeMove(true, false);
        if ( failureObject !== null && failureObject !== undefined ) {
            ctxt.log('I',"gotoFinalizeAction.beforeMove.failure", "px: " +  opPath);
            that.screenManager.showScreenPopup(failureObject); 
            ctxt.failure(failureObject);
            return;
        }

        ctxt.log('D',"gotoFinalizeAction.beforeMove.success", "px: " +  opPath);
        var op = that.getOperation( 'initial/_finalize' );
        if ( op === null ) {
            ctxt.failure(that.moveFailureMessage);
            return;
        }
        odkSurvey.pushSectionScreenState(opendatakit.getRefId());
        that._doActionAt(ctxt, op, op._token_type, true);
    },
    /*
     * Execute instructions beginning at the specified path.
     *
     * Success: we have successfully navigated to a screen
     *   displayed to the user or we have executed the 
     *   save_and_terminate action.
     *
     * Failure: we were unable to advance. In general, 
     *   this means we stay where we are.
     */
    gotoScreenPath:function(ctxt, path, advancing) {
        var that = this;
        ctxt.log('D','controller.gotoScreenPath');
        var opPath = that.getCurrentScreenPath();
        var currentOp = that.getOperation(opPath);
        
        var failureObject = that.beforeMove(true, advancing);
        if ( failureObject !== null && failureObject !== undefined ) {
            ctxt.log('I',"gotoContentsScreen.beforeMove.failure", "px: " +  opPath);
            that.screenManager.showScreenPopup(failureObject); 
            ctxt.failure(failureObject);
            return;
        }

        ctxt.log('D',"gotoScreenPath.beforeMove.success", "px: " +  opPath);
        var op = that.getOperation(path);
        if ( op === null ) {
            ctxt.failure(that.moveFailureMessage);
            return;    
        }
        // special case: jumping across sections
        //
        // do not push the current screen if we are changing sections,
        // as all section jumps implicitly save where they came from.
        if ( currentOp !== null && currentOp !== undefined && op._section_name === currentOp._section_name && advancing ) {
            odkSurvey.pushSectionScreenState(opendatakit.getRefId());
        }    
        that._doActionAt(ctxt, op, op._token_type, advancing);
    },
    /*
     * NOTE: invoked only by the parsequery webpage
     * initialization code. This should not be called
     * from anywhere else.
     *
     * Execute instructions beginning at the specified path.
     *
     * Success: we have successfully navigated to a screen
     *   displayed to the user or we have executed the 
     *   save_and_terminate action.
     *
     * Failure: we were unable to advance. In general, 
     *   this means we stay where we are.
     */
    startAtScreenPath:function(ctxt, path) {
        var that = this;
        ctxt.log('D','controller.startAtScreenPath');
        
        if ( path === null || path === undefined ) {
            path = opendatakit.initialScreenPath;
        }
        var op = that.getOperation(path);
        if ( op === null || op === undefined ) {
            ctxt.failure(that.moveFailureMessage);
            return;
        }
        that._doActionAt(ctxt, op, op._token_type, false);
    },
    /*
     * Remove all database changes since the last user-initiated save.
     *
     * Success: we have successfully deleted all checkpoint
     *   records for this instance the database.
     *
     * NOTE: the odkSurvey.ignoreAllChangesCompleted() call may terminate the webkit
     * before ctxt.success() is executed.
     *
     * Failure: we were unable to delete the records.
     */
    ignoreAllChanges:function(ctxt) {
         var model = opendatakit.getCurrentModel();
        var formId = opendatakit.getSettingValue('form_id');
        var instanceId = opendatakit.getCurrentInstanceId();
        database.ignore_all_changes($.extend({},ctxt,{success:function() {
                odkSurvey.ignoreAllChangesCompleted( opendatakit.getRefId(), instanceId);
                ctxt.success();
            },
            failure:function(m) {
                odkSurvey.ignoreAllChangesFailed( opendatakit.getRefId(), instanceId);
                ctxt.failure(m);
            }}), model, formId, instanceId);
    },
    /*
     * Execute a save-as-incomplete write of all database changes
     * since the last user-initiated save (all the checkpoint saves).
     *
     * Success: we have successfully saved-as-incomplete all checkpoint
     *   records for this instance the database.
     *
     * NOTE: the odkSurvey.saveAllChangesCompleted() call may terminate 
     * the webkit before ctxt.success() is executed.
     *
     * Failure: we were unable to save-as-incomplete the records.
     */
    saveIncomplete:function(ctxt) {
        var that = this;
        var model = opendatakit.getCurrentModel();
        var formId = opendatakit.getSettingValue('form_id');
        var instanceId = opendatakit.getCurrentInstanceId();
        database.save_all_changes($.extend({},ctxt,{success:function() {
                odkSurvey.saveAllChangesCompleted( opendatakit.getRefId(), instanceId, false);
                ctxt.success();
            },
            failure:function(m) {
                odkSurvey.saveAllChangesFailed( opendatakit.getRefId(), instanceId);
                ctxt.failure(m);
            }}), model, formId, instanceId, false);
    },
    /*
     * Callback interface from ODK Survey (or other container apps) into javascript.
     * Handles all dispatching back into javascript from external intents
    */
    actionCallback:function(ctxt, dispatchString, action, jsonObject) {
        var that = this;
        var dispatchObj = JSON.parse(dispatchString);
        var promptPath = dispatchObj.promptPath;
        var internalPromptContext = dispatchObj.userAction;
        var screenPath = that.getCurrentScreenPath();
        ctxt.log('I','controller.actionCallback', ((screenPath !== null && screenPath !== undefined) ? ("px: " + screenPath) : "no current prompt"));
        
        // promptPath is the path to the prompt issuing the doAction.
        // prompts know their enclosing screen, so we don't need to 
        // worry about that...
        var prompt = that.getPrompt(promptPath);
        if ( prompt !== null && prompt !== undefined ) {
            try {
                // ask this page to then get the appropriate handler
                var handler = prompt.getCallback(promptPath, internalPromptContext, action);
                if ( handler !== null && handler !== undefined ) {
                    handler( ctxt, internalPromptContext, action, jsonObject );
                } else {
                    ctxt.log('E','controller.actionCallback.noHandler: ERROR - NO HANDLER ON PROMPT!', 
                        promptPath + " internalPromptContext: " + internalPromptContext + " action: " + action);
                    ctxt.failure({message: "Internal error. No matching handler for callback."});
                    return;
                }
            } catch (e) {
                ctxt.log('E','controller.actionCallback.exception: EXCEPTION ON PROMPT!', 
                    promptPath,  + " internalPromptContext: " + internalPromptContext + " action: " +
                    action + " exception: " + e.message);
                ctxt.failure({message: "Internal error. Exception while handling callback."});
                return;
            }
        } else {
            ctxt.log('E','controller.actionCallback.noMatchingPrompt: ERROR - PROMPT NOT FOUND!',
                promptPath + " internalPromptContext: " + internalPromptContext + " action: " + action);
            ctxt.failure({message: "Internal error. Unable to locate matching prompt for callback."});
        }
    },
    changeUrlHash: function(ctxt,url){
        ctxt.log('I',"controller.changeUrlHash", url);
        window.location.hash = url;
        parsequery.changeUrlHash(ctxt);
    },
    // dispatch actions coming from odkCommon (Java code).
    delay: 400,
    insideQueue: false,
    insideCallbackCtxt: false,
    queuedActionAvailableListener: function() {
        var that = this;
        if ( this.insideQueue || this.insideCallbackCtxt ) return;
        try {
            this.insideQueue = true;
            var value = that.viewFirstQueuedAction();
            if ( value === null || value === undefined ) {
                return;
            }
            var action = JSON.parse(value);
            that.insideCallbackCtxt = true;
            var baseCtxt = that.newCallbackContext();
            var terminateCtxt = $.extend({},baseCtxt,{success: function() {
                    that.insideCallbackCtxt = false;
                    baseCtxt.success();
                    setTimeout(function() {
                        that.queuedActionAvailableListener();
                        }, that.delay);
                }, failure: function() {
                    that.insideCallbackCtxt = false;
                    baseCtxt.failure();
                    setTimeout(function() {
                        that.queuedActionAvailableListener();
                        }, that.delay);
                }});

            var innerCtxt = that.newCallbackContext();
            var ctxt = $.extend({}, innerCtxt, {success: function() {
                // TODO: do we want to do this on failure?
                // on success or failure, remove the queued action
                that.removeFirstQueuedAction();
                innerCtxt.success();
            }, failure: function() {
                // TODO: do we want to do pop up a toast on failure?
                // on success or failure, remove the queued action
                that.removeFirstQueuedAction();
                innerCtxt.failure();
            }});
            ctxt.setTerminalContext(terminateCtxt);
            if ( typeof action === 'string' || action instanceof String) {
                ctxt.log('I', "controller.queuedActionAvailableListener.changeUrlHash (immediate)", action);
                that.changeUrlHash(ctxt,action);
            } else {
                ctxt.log('I', "controller.queuedActionAvailableListener.actionCallback (immediate)", action.action);
                that.actionCallback( ctxt, action.dispatchString, action.action, action.jsonValue );
            }
        } finally {
            this.insideQueue = false;
        }
    },
    
    /**
     * This notifies the Java layer that the framework has been loaded and 
     * will register a listener for all of the queued actions, if any.
     */
    registerQueuedActionAvailableListener: function(ctxt, refId, m) {
        var that = this;
        var baseCtxt = that.newCallbackContext();
        var terminateCtxt = $.extend({},baseCtxt,{success: function() {
                odkCommon.registerListener(function() {that.queuedActionAvailableListener();});
                baseCtxt.success();
            }, failure: function() {
                odkCommon.registerListener(function() {that.queuedActionAvailableListener();});
                baseCtxt.failure();
            }});
        ctxt.setTerminalContext(terminateCtxt);
        if ( m === undefined || m === null ) {
            odkSurvey.frameworkHasLoaded(refId, true );
            ctxt.success();
        } else {
            odkSurvey.frameworkHasLoaded(refId, false );
            ctxt.failure(m);
        }
    },

    // exit the page
    leaveInstance:function(ctxt) {
        ctxt.success();
        // this would reset to the main page.
        // this.openInstance(ctxt, null);
    },
    createInstance: function(ctxt){
        var id = opendatakit.genUUID();
        this.openInstance(ctxt, id);
    },
    openInstance: function(ctxt, id, instanceMetadataKeyValueMap) {
        var that = this;

        // NOTE: if the openInstance call failed, we should popup the error from that...
        var popupbasectxt = that.newCallbackContext();
        var popupctxt = $.extend({}, popupbasectxt, {
            success: function() {
                popupbasectxt.log('D',"Unexpected openInstance.popupSuccess");
                popupbasectxt.success();
            },
            failure: function(m2) {
                popupbasectxt.log('D',"openInstance.popupFailure");
                if ( m2 && m2.message ) {
                    popupbasectxt.log('D',"openInstance.popupFailure", " message: " + m2.message);
                    // schedule a timer to show the mesage after the page has rendered
                    setTimeout(function() {
                        popupbasectxt.log('D',"openInstance.popupFailure.setTimeout");
                        that.screenManager.showScreenPopup(m2);
                    }, 500);
                }
                popupbasectxt.success();
        }});

        database.applyDeferredChanges($.extend({},ctxt,{success:function() {
            that.reset($.extend({},ctxt,{success:function() {
                if ( id === null || id === undefined ) {
                    opendatakit.clearCurrentInstanceId();
                } else {
                    opendatakit.setCurrentInstanceId(id);
                }
                var kvList = "";
                if ( instanceMetadataKeyValueMap !== null && instanceMetadataKeyValueMap !== undefined ) {
                    for ( var f in instanceMetadataKeyValueMap ) {
                        if (instanceMetadataKeyValueMap.hasOwnProperty(f)) {
                            var v = instanceMetadataKeyValueMap[f];
                            kvList = kvList + "&" + f + "=" + encodeURIComponent(v);
                        }
                    }
                }
                var qpl = opendatakit.getSameRefIdHashString(opendatakit.getCurrentFormPath(), 
                            id, opendatakit.initialScreenPath);
                


                // this does not reset the RefId...
                parsequery._prepAndSwitchUI( $.extend({},ctxt, {failure:function(m) {
                                ctxt.setChainedContext(popupctxt);
                                ctxt.failure(m);
                            }}), qpl, 
                            id, opendatakit.initialScreenPath,
                            opendatakit.getRefId(), false,
                            instanceMetadataKeyValueMap );
            }}),true);
        }}));
    },
    reset: function(ctxt,sameForm) {
        var that = this;
        ctxt.log('I','controller.reset');
        odkSurvey.clearSectionScreenState(opendatakit.getRefId());
        opendatakit.clearCurrentInstanceId();
        if ( that.screenManager !== null && that.screenManager !== undefined) {
            // this asynchronously calls ctxt.success()...
            that.screenManager.cleanUpScreenManager(ctxt);
        } else {
            ctxt.log('I','controller.reset.newScreenManager');
            that.screenManager = new ScreenManager({controller: that});
            that.screenManager.cleanUpScreenManager(ctxt);
        }
    },
    setLocale: function(ctxt, locale) {
        var that = this;
        database.setInstanceMetaData($.extend({}, ctxt, {success: function() {
            var op = that.getOperation(that.getCurrentScreenPath());
            if ( op !== null && op._token_type === 'begin_screen' ) {
                        that.setScreen(ctxt, op, {changeLocale: true});
            } else {
                ctxt.failure(that.moveFailureMessage);
            }
        }}), '_locale', locale);
    },
    ///////////////////////////////////////////////////////
    // Logging context
    baseContext : {
        loggingContextChain: [],
        
        log : function( severity, method, detail ) {
            var now = new Date().getTime();
            var log_obj = {method: method, timestamp: now, detail: detail };
            if ( this.loggingContextChain.length === 0 ) {
                this.loggingContextChain.push( log_obj );
            }
            // SpeedTracer Logging API
            var logger = window.console;
            if (logger && logger.timeStamp ) {
                logger.timeStamp(method);
            }
            var dlog =  method + " (seq: " + this.seq + " timestamp: " + now + ((detail === null || detail === undefined) ? ")" : ") detail: " + detail);
            odkCommon.log(severity, dlog);
 
        },

        success: function(){
            this.updateAndLogOutstandingContexts(this);
            this._log('S', 'success!');
            var pi = opendatakit.getPlatformInfo();
            var ll = (pi && pi.logLevel) ? pi.logLevel : 'D';
            var cctxt;
            if ( ll === 'T' ) {
                try {
                    throw Error("call stack details: ");
                } catch (e) {
                    this._log('T', e.stack);
                }
            }
            if ( this.chainedCtxt.ctxt !== null && this.chainedCtxt.ctxt !== undefined ) {
                cctxt = this.chainedCtxt.ctxt;
                setTimeout(function() {
                    cctxt.success();
                    }, 10);
            } else if ( this.terminalCtxt.ctxt !== null && this.terminalCtxt.ctxt !== undefined ) {
                cctxt = this.terminalCtxt.ctxt;
                setTimeout(function() {
                    cctxt.success();
                    }, 10);
            }
        },
        
        failure: function(m) {
            this.updateAndLogOutstandingContexts(this);
            this._log('E', 'failure! ' + (( m !== null && m !== undefined && m.message !== null && m.message !== undefined) ? m.message : ""));
            var pi = opendatakit.getPlatformInfo();
            var ll = (pi && pi.logLevel) ? pi.logLevel : 'D';
            var cctxt;
            if ( ll === 'T' ) {
                try {
                    throw Error("call stack details: ");
                } catch (e) {
                    this._log('T', e.stack);
                }
            }
            if ( this.chainedCtxt.ctxt !== null && this.chainedCtxt.ctxt !== undefined ) {
                cctxt = this.chainedCtxt.ctxt;
                setTimeout(function() {
                    cctxt.failure(m);
                    }, 10);
            } else if ( this.terminalCtxt.ctxt !== null && this.terminalCtxt.ctxt !== undefined ) {
                cctxt = this.terminalCtxt.ctxt;
                setTimeout(function() {
                    cctxt.failure(m);
                    }, 10);
            }
        },
        
        setChainedContext: function(ctxt) {
            // move our terminalCtxt to be the terminalCtxt of the ctxt being chained-to.
            if ( this.terminalCtxt.ctxt !== null && this.terminalCtxt.ctxt !== undefined ) {
                ctxt.setTerminalContext(this.terminalCtxt.ctxt);
                this.terminalCtxt.ctxt = null;
            }
            var cur = this;
            while ( cur.chainedCtxt.ctxt !== null && cur.chainedCtxt.ctxt !== undefined ) {
                cur = cur.chainedCtxt.ctxt;
            }
            cur.chainedCtxt.ctxt = ctxt;
        },
        
        setTerminalContext: function(ctxt) {
            // find the termination of our chain...
            var cur = this;
            while ( cur.chainedCtxt.ctxt !== null && cur.chainedCtxt.ctxt !== undefined ) {
                cur = cur.chainedCtxt.ctxt;
            }
            // if that already has a terminal context, insert this terminal
            // context in front of it.
            if ( cur.terminalCtxt.ctxt !== null && cur.terminalCtxt.ctxt !== undefined ) {
                ctxt.setTerminalContext(cur.terminalCtxt.ctxt);
            }
            cur.terminalCtxt.ctxt = ctxt;
        },

        _log: function( severity, contextMsg ) {
            var value = this.loggingContextChain[0];
            var flattened = contextMsg + " contextType: " + value.method + " (" +
                value.detail + ") seqAtEnd: " + this.getCurrentSeqNo();
            var pi = opendatakit.getPlatformInfo();
            var ll = (pi && pi.logLevel) ? pi.logLevel : 'D';
            switch(severity) {
            case 'S':
                odkCommon.log(severity, flattened);
                break;
            case 'F':
                odkCommon.log(severity, flattened);
                break;
            case 'E':
                odkCommon.log(severity, flattened);
                break;
            case 'W':
                if ( ll !== 'E' ) {
                    odkCommon.log(severity, flattened);
                }
                break;
            case 'I':
                if ( ll !== 'E' && ll !== 'W' ) {
                    odkCommon.log(severity, flattened);
                }
                break;
            case 'D':
                if ( ll !== 'E' && ll !== 'W' && ll !== 'I' ) {
                    odkCommon.log(severity, flattened);
                }
                break;
            case 'T':
                if ( ll !== 'E' && ll !== 'W' && ll !== 'I' && ll !== 'D' ) {
                    odkCommon.log(severity, flattened);
                }
                break;
            default:
                odkCommon.log(severity, flattened);
                break;
            }
        }
    },
    outstandingContexts: [],
    removeAndLogOutstandingContexts: function(ctxt) {
        var that = this;
        var i;
        for ( i = 0 ; i < that.outstandingContexts.length ; ++i ) {
            if ( that.outstandingContexts[i] === ctxt.seq ) {
                that.outstandingContexts.splice(i,1);
                break;
            }
        }
        if ( that.outstandingContexts.length === 0 ) {
                ctxt.log('D',"atEnd.outstandingContext nothingOutstanding!");
        } else {
            for ( i = 0 ; i < that.outstandingContexts.length ; ++i ) {
                ctxt.log('W',"atEnd.outstandingContext seqNo: " + that.outstandingContexts[i]);
            }
        }
    },
    newCallbackContext : function( actionHandlers ) {
        var that = this;
        that.eventCount = 1 + that.eventCount;
        var count = that.eventCount;
        that.outstandingContexts.push(count);
        var now = new Date().getTime();
        var detail =  "seq: " + count + " timestamp: " + now;
        var ctxt = $.extend({}, that.baseContext, 
            { seq: count, 
              loggingContextChain: [],
              getCurrentSeqNo:function() { return that.eventCount;},
              updateAndLogOutstandingContexts:function() { that.removeAndLogOutstandingContexts(this); },
              chainedCtxt: { ctxt: null },
              terminalCtxt: { ctxt: null } }, actionHandlers );
        ctxt.log('D','callback', detail);
        return ctxt;
    },
    newFatalContext : function( actionHandlers ) {
        var that = this;
        that.eventCount = 1 + that.eventCount;
        var count = that.eventCount;
        that.outstandingContexts.push(count);
        var now = new Date().getTime();
        var detail =  "seq: " + count + " timestamp: " + now;
        var ctxt = $.extend({}, that.baseContext, 
            { seq: count, 
              loggingContextChain: [],
              getCurrentSeqNo:function() { return that.eventCount;},
              updateAndLogOutstandingContexts:function() { that.removeAndLogOutstandingContexts(this); },
              chainedCtxt: { ctxt: null },
              terminalCtxt: { ctxt: null } }, actionHandlers );
        ctxt.log('D','fatal_error', detail);
        return ctxt;
    },
    newStartContext: function( actionHandlers ) {
        var that = this;
        that.eventCount = 1 + that.eventCount;
        var count = that.eventCount;
        that.outstandingContexts.push(count);
        var now = new Date().getTime();
        var detail =  "seq: " + count + " timestamp: " + now;
        var ctxt = $.extend({}, that.baseContext, 
            { seq: count, 
              loggingContextChain: [],
              getCurrentSeqNo:function() { return that.eventCount;},
              updateAndLogOutstandingContexts:function() { that.removeAndLogOutstandingContexts(this); },
              chainedCtxt: { ctxt: null },
              terminalCtxt: { ctxt: null } }, actionHandlers );
        ctxt.log('D','startup', detail);
        return ctxt;
    },
    newContext: function( evt, actionHandlers ) {
        var that = this;
        that.eventCount = 1 + that.eventCount;
        var count = that.eventCount;
        that.outstandingContexts.push(count);
        var detail;
        var type;
        if ( evt === null || evt === undefined ) {
            try {
                throw new Error('dummy');
            } catch (e) {
                odkCommon.log('E',"no event passed into newContext call: " + e.stack);
            }
            detail =  "seq: " + count + " <no event>";
            type = "<no event>";
        } else {
            detail =  "seq: " + count + " timestamp: " + evt.timeStamp + " guid: " + evt.handleObj.guid;

            var evtActual;
            var evtTarget;
            if ( 'currentTarget' in evt ) {
                detail += ' curTgt: ';
                evtActual = evt.currentTarget;
            } else {
                detail += ' tgt: ';
                evtActual = evt.target;
            }
            
            if ( evtActual == window) {
                detail += 'Window';
            } else {
                evtTarget = ('innerHTML' in evtActual) ? evtActual.innerHTML : evtActual.activeElement.innerHTML;
                detail += evtTarget.replace(/\s+/g, ' ').substring(0,80);
            }
            type = evt.type;
        }
        
        var ctxt = $.extend({}, that.baseContext, 
            { seq: count, 
              loggingContextChain: [],
              getCurrentSeqNo:function() { return that.eventCount;},
              updateAndLogOutstandingContexts:function() { that.removeAndLogOutstandingContexts(this); },
              chainedCtxt: { ctxt: null },
              terminalCtxt: { ctxt: null } }, actionHandlers );
        ctxt.log('D', type, detail);
        return ctxt;
    }

};
});
