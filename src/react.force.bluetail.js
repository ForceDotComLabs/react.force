/*
 * Copyright (c) 2016, salesforce.com, inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
 * promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var { SalesforceNetReactBridge, SFNetReactBridge } = require('react-native').NativeModules;
var forceCommon = require('./react.force.common.js');

var bluetailAccessToken = "",
    bluetailAuthResponse = {};


var bluetailLoginPreprodEndpoint = 'https://login.preprod.bluetail.salesforce.com',
    bluetailPreprodEndpoint = 'https://preprod.bluetail.salesforce.com';

/**
 * Set apiVersion to be used
 */
var setApiVersion = function(version) {
    apiVersion = version;
}

/**
 * Return apiVersion used
 */
var getApiVersion = function() {
    return apiVersion;
}

/**
 * Send arbitray force.com request
 */
var sendRequest = function(endPoint, path, successCB, errorCB, method, payload, headerParams) {
    method = method || "GET";
    payload = payload || {};
    headerParams = headerParams || {};
    var args = {endPoint: endPoint, path:path, method:method, queryParams:payload, headerParams:headerParams};
    forceCommon.exec("SFNetReactBridge", "SalesforceNetReactBridge", SFNetReactBridge, SalesforceNetReactBridge, successCB, errorCB, "sendRequest", args);
}

/**
 * Get the bluetail access token using the clientId, clientSecret, username and password
 * @param  {Function} callback callback to call upon completion
 * @param  {Function}   error    error callback to call if auth fails
 */
var getBluetailAccessToken = function(callback, error){
    let btClientId = 'B7CLi3N7',
        btClientSecret = 'bTCL753Cr37',
        btUserName = 'B7Us3r',
        btPassword = 'bTu53rP4SWD';

    var options = {
        path: '/oauth/token',
        method: 'POST',
        headers: {
            'Accept':'application/json',
            'Authorization':'Basic QjdDTGkzTjc6YlRDTDc1M0NyMzc=',
            'Content-Type':'application/x-www-form-urlencoded',
            'Origin':'http://test.salesforce.com'
        },
        body: 'client_id='+ btClientId +'&client_secret='+ btClientSecret + '&username=' + btUserName + '&password=' + btPassword + '&grant_type=password' + '&org_id=org62&sc_user=1234'
    };

    fetch(bluetailLoginPreprodEndpoint + options.path, {method: "POST", body: options.body, headers: options.headers})
    .then((response) =>
        response.json())
    .then((responseData) => {
        console.log('bluetail oauth response' + responseData);
        bluetailAuthResponse = responseData;
        callback();
    }).done();
}

/**
 * Checks to see if the bluetail access token exists before proceeding
 * @param  {Function} callback callback to call after access token is retrieved
 */
var checkBluetailAccessToken = function(callback){
    (!bluetailAuthResponse.access_token) ? getBluetailAccessToken(callback) : callback();
}

/**
 * Gets logo based on the company name passed in
 * @param  {String}   companyName company name to request logo for
 * @param  {Function} callback    callback to call after the logo is retrieved
 * @param  {Function}   error       error callback to call if the logo retrieval fails
 */
var btLogoRequest = function(companyName, callback, error){
    checkBluetailAccessToken(()=>{
        var options = {
            path: '/v10/company/logo/query',
            method: 'POST',
            headers: {
                'Content-Type':'application/json',
                'Accept':'application/json',
                'Authorization':'Bearer ' + bluetailAuthResponse.access_token,
                'Origin':'http://test.salesforce.com'
            },
            body: '{"companyLogoRequestItems":[{"account":{"name":"' + companyName+ '","anonymizedId":"ACCOUNT_ID"},"activityContext":{"locationType":"LocationType","clientType":"ClientType","clientDevice":"ClientDevice"}}],"userInfo":{"org":{"anonymizedId":"ORG_ANONYNIZED_ID"},"user":{"anonymizedId":"USER_ANONYNIZED_ID"}}}'
        };

        fetch(bluetailPreprodEndpoint + options.path, {method: "POST", body: options.body, headers: options.headers})
        .then((response) =>
            response.json())
        .then((responseData) => {
            callback(responseData);
        }).done();
    })
}

/**
 * Gets logos based on an array of company names using the bluetail batch logo api
 * @param  {Array}   companyNames list of company names
 * @param  {Function} callback     callback to call after the logos are retrieved
 * @param  {Function}   error        error callback to call if the logo retrieval fails
 */
var btLogoBatchRequest = function(companyNames, callback, error){
    checkBluetailAccessToken(()=>{
        function createSingleRequest(companyName) {
            return '{"account":{"name":"' + companyName + '","anonymizedId":""},"activityContext":{"locationType":"","clientType":"","clientDevice":""}}';
            // return '{"account":{"name":"' + companyName + '","anonymizedId":"ACCOUNT_ID"},"activityContext":{"locationType":"LocationType","clientType":"ClientType","clientDevice":"ClientDevice"}}],"userInfo":{"org":{"anonymizedId":"ORG_ANONYNIZED_ID"}';
        }

        var batchRequest = companyNames.map((companyName)=>{return createSingleRequest(companyName)}).join();
        var options = {
            path: '/v10/company/logo/query',
            method: 'POST',
            headers: {
                'Content-Type':'application/json',
                'Accept':'application/json',
                'Authorization':'Bearer ' + bluetailAuthResponse.access_token,
                'Origin':'http://test.salesforce.com'
            },
            body: '{"companyLogoRequestItems":['+ batchRequest + '],"userInfo":{"org":{"anonymizedId":""},"user":{"anonymizedId":""}}}'
        };

        fetch(bluetailPreprodEndpoint + options.path, {method: "POST", body: options.body, headers: options.headers})
        .then((response) =>
            response.json())
        .then((responseData) => {
            callback(responseData);
        }).done();
    })
}

/**
 * Get bluetail insights for a compane name passed in
 * @param  {String}   companyName
 * @param  {Function} callback    callback to call after the insights for the company are retrieved
 * @param  {Function}   error       error callback to call if the insights retrieval fails
 */
var btInsightsRequest = function(companyName, callback, error){
    checkBluetailAccessToken(()=>{
        var options = {
            path: '/v10/insights/query',
            method: 'POST',
            headers: {
                'Content-Type':'application/json',
                'Accept':'application/json',
                'Authorization':'Bearer ' + bluetailAuthResponse.access_token,
                'Origin':'http://test.salesforce.com'
            },
            body: '{"insightsRequestItems":[{"maxInsights":10,"accounts":[{"name":"'+ info.name.substr(0, info.name.indexOf(" ")) + '","website":"null","emailDomain":null,"stockTicker":null,"phone":null,"address":null,"industry":"Software","sic":null,"employees":null,"annualRevenue":null,"relatedAccounts":null,"anonymizedId":"123456","bluemasterId":null,"ranking":null}],"contacts":null,"activityContext":{"locationType":"sanity-locationType","clientType":"sanity-clientType","clientDevice":"sanity-clientDevice"}}],"searchOptions":{"extendedCoverage":true},"userInfo":{"org":{"anonymizedId":"sanity-org-anonymizedId","industry":"sanity-industry"},"user":{"anonymizedId":"sanity-user-anonymizedId","role":"sanity-role","department":"sanity-department","title":"sanity-title"}}}'
        };

        fetch(bluetailPreprodEndpoint + options.path, {method: "POST", body: options.body, headers: options.headers})
        .then((response) =>
            response.json())
        .then((responseData) => {
            callback(responseData);
        }).done();
    })
}

/**
 * Part of the module that is public
 */
module.exports = {
    setApiVersion: setApiVersion,
    getApiVersion: getApiVersion,
    sendRequest: sendRequest,
    btLogoRequest: btLogoRequest,
    btLogoBatchRequest: btLogoBatchRequest,
    btInsightsRequest: btInsightsRequest
};
