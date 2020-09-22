import $ from 'jquery';
import 'jquery-validation';
import {
	getPostURL,
	getNumSignupsAndTarget,
	showFullPageLoading,
	hideFullPageLoading,
    sendPetitionTracking } from './jquery.mc.form-helper.js';
    

function initProgressBar() {
    let {numSignupTarget, numSignup} = getNumSignupsAndTarget()

	$(".progress-target").text(numSignupTarget.toLocaleString())
    $(".progress-number").text(numSignup.toLocaleString())
    
    const ProgressBar = require('progressbar.js');
    let percent = numSignup / numSignupTarget;
    let bar = new ProgressBar.Line('#progress-bar', {
        strokeWidth: 3,
        easing: 'easeInOut',
        duration: 1000,
        color: '#b5ddac',
        trailColor: '#eee',
        trailWidth: 1,
        svgStyle: {width: '100%', height: '100%'}
    });
    // console.log(percent)
    bar.animate(percent);
}

function createYearOptions() {
    let currYear = new Date().getFullYear()
    $("#birthYear").append(`<option value="">選擇年份</option>`);
    for (var i = 0; i < 80; i++) {
        let option = `<option value="${currYear-i}-01-01">${currYear-i}</option>`;
        $("#birthYear").append(option);
    }
}

function checkInput() {
    //console.log('checkInput');
    $('.error-message').remove();
    let pass = true;

    if (!lastName.value) {
        pass = false;
        $(`<span class="error-message">必填欄位</span>`).insertAfter("#lastName");
    }
    else if (! /^[\u4e00-\u9fa5_a-zA-Z_ ]{1,40}$/i.test(lastName.value) || ! /^[\u4e00-\u9fa5_a-zA-Z_ ]{1,40}$/i.test(lastName.value)) {
        pass = false;
        $(`<span class="error-message">請不要輸入數字或符號</span>`).insertAfter("#lastName");
    }

    if (!firstName.value) {
        pass = false;
        $(`<span class="error-message">必填欄位</span>`).insertAfter("#firstName");
    }
    else if (! /^[\u4e00-\u9fa5_a-zA-Z_ ]{1,40}$/i.test(firstName.value) || ! /^[\u4e00-\u9fa5_a-zA-Z_ ]{1,40}$/i.test(lastName.value)) {
        pass = false;
        $(`<span class="error-message">請不要輸入數字或符號</span>`).insertAfter("#firstName");
    }

    if (!email.value) {
        pass = false;
        $(`<span class="error-message">必填欄位</span>`).insertAfter("#email");
    }
    else if (! /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/i.test(email.value)) {
        pass = false;
        $(`<span class="error-message">Email 格式錯誤</span>`).insertAfter("#email");
    }

    if (!phone.value && window.location.href.indexOf("utm_source=dd")<0) {
        pass = false;
        $(`<span class="error-message">必填欄位</span>`).insertAfter("#phone");
    }
    else if (phone.value && ! /^(0|886|\+886)?(9\d{8})$/.test(phone.value) && ! /^(0|886|\+886){1}[2-8]-?\d{6,8}$/.test(phone.value)) {
        pass = false;
        $(`<span class="error-message">電話格式不正確，格式應為 0912345678 和 02-23456789</span>`).insertAfter("#phone");
    }

    if (birthYear.value == "") {
        pass = false;
        $(`<span class="error-message">必填欄位</span>`).insertAfter("#birthYear");
    }

    return pass;
}

function checkEmail() {
    //email suggestion / email correctness
	let domains = [
		"me.com",
		"outlook.com",
		"netvigator.com",
		"cloud.com",
		"live.hk",
		"msn.com",
		"gmail.com",
		"hotmail.com",
		"ymail.com",
		"yahoo.com",
		"yahoo.com.tw",
		"yahoo.com.hk"
	];
	let topLevelDomains = ["com", "net", "org"];

	var Mailcheck = require('mailcheck');
	//console.log(Mailcheck);
	$("#email").on('blur', function() {
		console.log('center_email on blur - ',  $("#center_email").val());		
		Mailcheck.run({
			email: $("#email").val(),
			domains: domains, // optional
			topLevelDomains: topLevelDomains, // optional
			suggested: (suggestion) => {
                console.log(suggestion);
                $('#email-div .error-message').remove();
                $(`<div class="email-suggestion">您想輸入的是 <strong id="emailSuggestion">${suggestion.full}</strong> 嗎？</div>`).insertAfter("#email");
				//$('#emailSuggestion').html(suggestion.full);
				//$('.email-suggestion').show();
                
                $(".email-suggestion").click(function() {
                    $("#email").val($('#emailSuggestion').html());
                    $('.email-suggestion').remove();
                });
			},
			empty: () => {
				this.emailSuggestion = null
			}
		});
	});
}

function beforeSubmit() {
    if (!checkInput())
        return;

    showFullPageLoading();	
    
    // mc forms
    $('#mc-form [name="FirstName"]').val($('#firstName').val());
    $('#mc-form [name="LastName"]').val($('#lastName').val());
    $('#mc-form [name="Email"]').val($('#email').val());
    $('#mc-form [name="MobilePhone"]').val($('#phone').val());
    $('#mc-form [name="Birthdate"]').val($('#birthYear').val());			
    $('#mc-form [name="OptIn"]').eq(0).prop("checked", $('#optin').prop('checked')); 
    
    // collect values in the mc form
    let formData = new FormData();
    $("#mc-form input").each(function (idx, el) {
        let v = null
        if (el.type==="checkbox") {
            v = el.checked
        } else {
            v = el.value
        }

        formData.append(el.name, v)
        console.log("Use", el.name, v)
    });
    
    // send the request			
    let postUrl = getPostURL(); //$("#mc-form").prop("action");
    
    fetch(postUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(response => {				
        if (response) {					
            if (response.Supporter) { // ok, go to next page
                sendPetitionTracking("2020-climate_energy_bulkuser");
            }
            $("#landing-page").hide();
            $("#thank-you-page").css("display","flex");
            $("header").hide();
            $('html, body').scrollTop(0);
        } else {
            //showSubmittedError();
            console.error('error');
        }
        hideFullPageLoading();
    })
    .catch(error => {
        hideFullPageLoading();
        //showSubmittedError();
        console.error(error);
    });    
}

$(document).ready(function() {   
    let AOS = require('AOS'); 
    AOS.init();
    initProgressBar();
    createYearOptions();
    checkEmail();
    
    $('.mobile-arrow').on( "click", function() {
        //console.log(this.parentNode.getAttribute('data-target'));         
        $('html, body').animate({
            scrollTop: $("#section-" + this.parentNode.getAttribute('data-target')).offset().top
        }, 1000);
    });    
    
    $('.sign-up-btn').on( "click", function() {     
        $('html, body').animate({
            scrollTop: $("#section-2").offset().top
        }, 1000);
    });

    $('.donate-btn').on( "click", function() {     
        window.open('https://supporter.ea.greenpeace.org/tw/s/donate?campaign=climate&ref=2020-climate_energy_bulkuser_thankyoupage_donation_btn', '_blank');
    });

    $('.submit-btn').on( "click", function(e) {          
        e.preventDefault();        
        beforeSubmit();
    });
});