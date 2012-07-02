/*
 * 
 * mcValidate - Client-side Form Validation
 * Version 1.0.0
 * @requires jQuery v1.2.3 or higher
 * 
 * Copyright (c) 2012 William Lee
 * Examples and docs at: https://github.com/wleemilco/mcValidate
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * 
 */
/**
 * 
 * @description Simple client-side validation solution using CSS and with configurable output settings 
 * 
 * @example $(document).mcValidate();
 * @desc Create and initialize with default settings
 * 
 * @type jQuery
 * 
 * @name mcValidate
 * 
 * @cat Plugins/mcValidate
 * 
 * @author William Lee/william@solidcoding.com/http://www.solidcoding.com
 */

(function( $ ){
    $.extend({
        mcValidate: new
        function () {

			this.validationStates = {
				'error':0,
				'success':1
			};
			
			this.validationAnimations = {
				'hide':0,
				'show':1
			};  
			
			this.formSubmitAlerted = 0;
			this.formSubmitErrorEncountered = 0;
			this.formSubmitTimeout = null;

            this.defaults = {
            	validationDefaultEvent: "submit", //options: blur, formSubmit
            	defaultMcValidationAlertBoxShowType: "fade", //options: show, slide, fade 
            	validationDefaultFormSubmitID: "",
            	validationAlertFunction: defaultValidationAlertHandler,
            	validationSubmitFailFunction: defaultSubmitFailHandler,
                validationAlertMode: "all", //only applies to formSubmit, options: single, all, single: validation stops after first alert
                validationAlertFocus: "last", //only applies to formSubmit, and when alertMode is all, options: first, last
                debug: false
            };
            
            this.construct = function (settings) {
                return this.each(function () {
                	$this = $(this);
					
                    // new blank config object
                    this.config = {};
                    // merge and extend.
                    config = $.extend(this.config, $.mcValidate.defaults, settings);
                    
                    //alert(config['validationAlertMode']);
                    
                	//apply mcValidate initialization to all children
                	$this.find('[class*=mcValidate]').each(
						function() {
							//create DOM elements for each validation item
							var identifier;
							
							if($(this).attr('id').length > 0) {
								identifier = $(this).attr('id');	
							}
							else if($(this).attr('name').length > 0) {
								identifier = $(this).attr('name');
							}
							else {
								identifier = 'noidentifier';
							}
							
							if(identifier == 'noidentifier') {
								console.log('Input tag missing id/name field');
							}
							else {
								var newElement = $('<input type="hidden" class="mcValidationFlag" value="0" id="data[validateFlag][' + identifier + ']" name="data[validateFlag][' + identifier + ']" />');			
								$(this).parent().append(newElement);
							}							
							
						}
					);                     

					if(config['validationDefaultEvent'] != 'submit') {
						$this.find('[class*=mcValidateBetween]').each(
							function() {
								$(this).bind(config['validationDefaultEvent'],validatorBetween);	
							}
						);	
					}
					
					$this.find('[class*=mcValidateOnSubmit]').each(
						function() {
							$(this).bind('submit',{ parentElement: $(this) }, validatorSubmit);	
						}
					);
                	                           
            	});
            };        
            
            function validatorSubmit(event) {
            	
        		//reset this
        		$.mcValidate.formSubmitErrorEncountered = 0;
        		$.mcValidate.formSubmitTimeout = null;
				event.data.parentElement.find('[class*=mcValidateBetween]').each(
					function() {
						if(config['validationAlertMode'] == 'single') {
							if($.mcValidate.formSubmitErrorEncountered == 0) {
								validatorBetween.apply($(this), []);		
							}	
						}
						else {
							validatorBetween.apply($(this), []);	
						}
					}
				);          
				
				if($.mcValidate.formSubmitErrorEncountered != 0) {
					config['validationSubmitFailFunction'].apply($(this), []);
					return false;
				}  	
            }
            
			function validatorBetween() {

				var elementClassesStr = $(this).attr('class');		
				var classList = elementClassesStr.split(/\s+/);
				var i = 0;
				var j = 0;
				var low = 0; 
				var high = 0;
				var currentVal = 0;
				
				for (i = 0; i < classList.length; i++) {
				   if (classList[i].substring(0,18) === 'mcValidateBetween_') {
				   		var splitList = classList[i].split(/_/);
				   		
				   		if(splitList.length == 3) {
				   			low = parseFloat(splitList[1]);
				   			high = parseFloat(splitList[2]);
				   		}
				   }
				}
				
				currentVal = parseFloat($(this).val());
				
				if(currentVal < low || currentVal > high) {
					if(canAlert($(this)) == true) {
						setAlerted($(this));
						//alert(currentVal + ' ' + low + ' ' + high);
						//alertMsg = getAlertMessage($(this),'The value entered is out of range ['+ low + ' - ' + high + ' ]');
						
						var alertMsgParams;
						var alertMsg;
						
						alertMsgParams = [$(this),'The value entered is out of range ['+ low + ' - ' + high + ']',currentVal,low,high];
						alertMsg = getAlertMessage.apply($(this), alertMsgParams);
						
						config['validationAlertFunction'].apply($(this), [$.mcValidate.validationStates.error, alertMsg]);
						
						postValidationErrorHandler($(this));						
					}
				}
				else {

					var successMsgParams;
					var successMsg;
					
					successMsgParams = [$(this),'',currentVal,low,high];
					successMsg = getSuccessMessage.apply($(this), successMsgParams);
					config['validationAlertFunction'].apply($(this), [$.mcValidate.validationStates.success, successMsg]);
				}															
	
			}            
            
			function formatAlertMessage(stringToFormat) {  
			    var args = arguments;  
			    var pattern = new RegExp("%([1-" + arguments.length + "])", "g");  
			    return String(stringToFormat).replace(pattern, function(match, index) {  
			    		return args[index];  
			    	});  
		    };
		    
		    function postValidationErrorHandler(element) {
				//just for form submits, doesn't do anything for other events			
				$.mcValidate.formSubmitErrorEncountered = this.formSubmitErrorEncountered + 1;
				
				//focus on offending field
                if(config['validationAlertFocus'] == 'first') {
                	if($.mcValidate.formSubmitTimeout == null) {
                		$.mcValidate.formSubmitTimeout = setTimeout(function() { element.focus(); },50);
                	}
                }	
                else if(config['validationAlertFocus'] == 'last') {
                	if($.mcValidate.formSubmitTimeout == null) {
                		$.mcValidate.formSubmitTimeout = setTimeout(function() { element.focus(); },50);
                	}
                	else {
                		clearTimeout($.mcValidate.formSubmitTimeout);
                		$.mcValidate.formSubmitTimeout = setTimeout(function() { element.focus(); },50);
                	}                	
                }			
				
		    }              
            
            function defaultValidationAlertHandler(validationState, msg) {
            	//by default, search for mcValidationAlertBox and make visible/hidden depending on state
            	//as fallback, do an alert by default
            	if(validationState == $.mcValidate.validationStates.error) {
            		if($(this).parent().children('[class*=mcValidationAlertBox]').length == 0) {
            			alert(msg);	
            		}
            		else {
            			//show box
            			defaultValidationAlertAnimation($(this).parent().children('[class*=mcValidationAlertBox]'),$.mcValidate.validationAnimations.show);
            		}
            		
            		//focus on the field with the error
            		setTimeout(function() { $(this).focus(); },50);
            	}
            	else if(validationState == $.mcValidate.validationStates.success) {
            		if($(this).parent().children('[class*=mcValidationAlertBox]').length > 0) {
            			//hide box	
            			defaultValidationAlertAnimation($(this).parent().children('[class*=mcValidationAlertBox]'),$.mcValidate.validationAnimations.hide);
            		}            		
            	}
            			
            }
            
            //placeholder: do nothing
            function defaultSubmitFailHandler() {
            }
            
            function defaultValidationAlertAnimation(e,validationAnimation) {
            	//by default, search for mcValidationAlertBox and make visible/hidden depending on state
            	//as fallback, do an alert by default
            	if(validationAnimation == $.mcValidate.validationAnimations.show) {
					if(config['defaultMcValidationAlertBoxShowType'] == 'show') {
						e.show();
					}
					else if(config['defaultMcValidationAlertBoxShowType'] == 'slide') {
						e.slideDown();
					}
					else if(config['defaultMcValidationAlertBoxShowType'] == 'fade') {
						e.fadeIn();
					}														
            	}
            	else if(validationAnimation == $.mcValidate.validationAnimations.hide) {
					if(config['defaultMcValidationAlertBoxShowType'] == 'show') {
						e.hide();
					}
					else if(config['defaultMcValidationAlertBoxShowType'] == 'slide') {
						e.slideUp();
					}
					else if(config['defaultMcValidationAlertBoxShowType'] == 'fade') {
						e.fadeOut();
					}	
            	}
            			
            }            
            
            function canAlert(e) {
				if(e.parent().children('[class*=mcValidationFlag]').length == 0)
					return false;
				
				//if in single alert mode, if flag has been set, don't alert again
				if(e.parent().children('[class*=mcValidationFlag]').first().val() == 1)
					return false;
					
				return true;            			
            }
            
            function getAlertMessage(e,defaultMsg) {
				//search e for custom alert message, if not, use defaultMsg
				var alertMsg = defaultMsg;
				
				if(e.parent().children('[class*=mcValidationCustomAlertMsg]').length > 0) {
					alertMsg = e.parent().children('[class*=mcValidationCustomAlertMsg]').first().html();
					
					//replace with arguments if necessary
					alertMsgArguments = new Array(alertMsg);
					var args = Array.prototype.slice.call(arguments);
					args = args.slice(2);
					alertMsgArguments = alertMsgArguments.concat(args);
					alertMsg = formatAlertMessage.apply($(this), alertMsgArguments);	
				}

				return alertMsg;            			
            }
            
            function getSuccessMessage(e,defaultMsg) {
				//search e for custom alert message, if not, use defaultMsg
				var successMsg = defaultMsg;
				
				if(e.parent().children('[class*=mcValidationCustomSuccessMsg]').length > 0) {
					successMsg = e.parent().children('[class*=mcValidationCustomSuccessMsg]').first().html();
					
					//replace with arguments if necessary
					successMsgArguments = new Array(successMsg);
					var args = Array.prototype.slice.call(arguments);
					args = args.slice(2);
					successMsgArguments = successMsgArguments.concat(args);
					successMsg = formatAlertMessage.apply($(this), alertMsgArguments);	
				}

				return successMsg;            			
            }            

            function setAlerted(e) {
				//set flag for element e that it has triggered a validation error
				e.parent().children('[class*=mcValidationFlag]').first().val(1);				  			
            }                                                     
    	}
    });
  	
// extend plugin scope
$.fn.extend({
    mcValidate: $.mcValidate.construct
});  	
  	
})( jQuery );