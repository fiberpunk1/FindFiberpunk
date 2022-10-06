// ==UserScript==
// @name         Find My Device
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fiberpunk website enhanced plug-in
// @author       Fiberpunk
// @match        https://fiber-punk.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=fiber-punk.com
// @connect      *
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @require      https://lib.baomitu.com/jquery/3.6.0/jquery.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/layer/3.1.1/layer.min.js
// ==/UserScript==

(function() {
    'use strict';

    if (self != top) {
        return;
    }

    // Config
    var url_template = "http://{{prefix}}.{{number}}:88/find";
    var min = 2, max = 255;
    var timeout = 1000;
    var resultCount = 0;

    $(document.body).append('<link href="https://cdn.bootcdn.net/ajax/libs/layer/3.1.1/theme/default/layer.min.css" rel="stylesheet">');

    $(".nav-bar__linklist").append('<li class="nav-bar__item" style="float:right;margin-right:0;"><a href="javascript:;" id="nav-find-device" class="nav-bar__link link" data-type="menuitem">Find My Device</a></li>');

    var html =
        '<div style="padding:16px;">' +
        '<div style="margin-bottom:16px;"><strong>IP Config:</strong> <input type="text" id="input-prefix" value="" placeholder="" style="width:120px;" /> .xxx</div>' +
        '<button id="button-start" class="button button--primary" style="width:100%;margin-bottom:16px;">Start Finding</button>' +
        '<h2 style="margin-bottom:0;"><strong>Device List</strong></h2>' +
        '<ul id="result-list" class="icon-list lh-base">' +
        '<li class="item no-device">Waiting for finding ...</li>' +
        '</ul>' +
        '</div>';

    $('#nav-find-device').click(function(){
        layer.open({
            area: ['30%', '50%'],
            type: 1,
            title: "Find My Device",
            content: html,
            success: function(layero, index){
                // console.log(layero, index);
                layerPageInit(layero, index);
            }
        });
    });

    // Init
    function layerPageInit(layero, index) {
        $("#input-prefix").val(GM_getValue("input-prefix", "192.168.1"));

        $("#button-start").click(function () {
            let prefix = $.trim($("#input-prefix").val());
            if (prefix.length == 0) {
                layer.msg("Please enter the IP config");
                $("#input-prefix").focus();
                return;
            }
            if (prefix.split(".").length != 3) {
                layer.msg("IP config format error");
                $("#input-prefix").focus();
                return;
            }

            GM_setValue("input-prefix", prefix);

            $(this).attr("disabled", "disabled");
            resultCount = 0;
            $("#result-list li.no-device").html('Finding ...');
            $("#result-list li:not('.no-device')").remove();

            loopFind(min);
        });
    }

    function loopFind(i) {
        if (i > max) {
            return;
        }
        let url = url_template.replace("{{prefix}}", GM_getValue("input-prefix")).replace("{{number}}", i);
        // console.log(url);
        GM_xmlhttpRequest({
            method: "get",
            url: url,
            timeout: timeout,
            onload: function(r) {
                let respone_str = $.trim(r.responseText);
                if (respone_str.startsWith("Beam")) {

                    let list_d = respone_str.split(":");
                    if( list_d.length>=2){
                        onResult(true, i, list_d[1]);
                    }
                    else{
                        onResult(true, i, "Fiberpunk-Node");
                    }

                   
                }
            },
            onabort: function() {
                onResult(false, -1, " ");
            },
            onerror: function() {
                onResult(false, -1, " ");
            },
            ontimeout: function() {
                onResult(false, -1, " ");
            }
        });
        setTimeout(function(){
            loopFind(i + 1);
        }, 10);
    }

    function onResult(isSuccess, number, device_name) {
        resultCount += 1;
        if (number != -1) {
            let itemHtml = '<li class="item"><a href="http://{{prefix}}.{{number}}:88" target="_blank" rel="noopener" class="link link--accented">{{device_name}}:{{prefix}}.{{number}}</a></li>';
            $("#result-list").append(itemHtml.replace(/\{\{prefix\}\}/g, GM_getValue("input-prefix")).replace(/\{\{number\}\}/g, number).replace(/\{\{device_name\}\}/g, device_name));
        }
        if (resultCount >= (max - min)) {
            $("#result-list li.no-device").html('Find the end');
            $("#button-start").removeAttr("disabled");
        }
        // console.log(resultCount);
    }
})();