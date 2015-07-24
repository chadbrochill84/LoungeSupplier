// ==UserScript==
// @name                CSGOLounge Lounge Supplier
// @namespace           CSGOLounge Lounge Supplier
// @author              Z8pn
// @author_steam        http://steamcommunity.com/profiles/76561198142908602
// @include             /^http(s)?://(www.)?csgolounge.com//
// @require             http://code.jquery.com/jquery-2.1.1.js
// @grant               GM_addStyle
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_xmlhttpRequest
// @downloadURL         https://raw.githubusercontent.com/Z8pn/LoungeSupplier/master/main.js
// ==/UserScript==

var Nickname;
var ItemInOffer;
var TextToSend;
var numberOfDaysBack;
var CurrentLoungeSite;
var CurrentMatches = {};
var WaitBeforeOffers = 0; // Message box after each pop-up ?
var WindowTimeOut = 5000; // MS after the window gets closed if the offer wasn´t posted
var WindowCanTimeout = 0; // Window closes itself if no response.

var useful = {};
var Initialize = {};


useful.getTodaysDate = function() {
    var now     = new Date();
    var year    = now.getFullYear();
    var month   = now.getMonth()+1;
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds();

    // format the strings without a bunch of if blocks
    MM = ("00" +  month).slice(-2);
    dd = ("00" +    day).slice(-2);
    hh = ("00" +   hour).slice(-2);
    mm = ("00" + minute).slice(-2);
    ss = ("00" + second).slice(-2);

    return year + '/' + MM + '/' + dd + ' ' + hh + ':' + mm + ':' + ss;
}




useful.getUrlPart = function( name, url ) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results == null ? null : results[1];
}

useful.InsertAfter = function (newElement,targetElement) {
    var parent = targetElement.parentNode;

    if(parent.lastchild == targetElement) {
        parent.appendChild(newElement);
    } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
    }
}

useful.nextSite = function (){
    CurrentSite = useful.getUrlPart('p', window.location.href)-1;
    if (CurrentSite == null) { CurrentSite = 0; }
    if (document.getElementsByTagName("li")[CurrentSite+1]){
        var sites = document.getElementsByTagName("li")[CurrentSite+1].getElementsByTagName("a")[0];
        sites.setAttribute("href",sites.getAttribute("href")+"#auto");
        sites.click();
    } else {
        GM_setValue("jmpmode","no");
        AdvancedMode = "no";
        var btn = document.getElementById("automodebtn")
        btn.innerHTML = "Auto=" + AdvancedMode;
    }
}

useful.SplitString = function (CommaSepStr) {
    var ResultArray = [];
    var SplitChars = ',';
    if (CommaSepStr!= null) {
        if (CommaSepStr.search(",") == -1) {
            ResultArray.splice(1, 0, CommaSepStr);
        } else {
            if (CommaSepStr.indexOf(SplitChars) > -1) {
                ResultArray = CommaSepStr.split(SplitChars);
            }
        }
    }
    return ResultArray ;
}

Initialize.ini = function() {
    Initialize.addElements();
    Nickname = GM_getValue("Nickname","None");
    ItemInOffer = GM_getValue("offeritems","");
    numberOfDaysBack = GM_getValue("daysback",15);

    TextToSend = GM_getValue("offertext","Please enter a text in the settings");
    if (TextToSend == "undefined"){
        TextToSend = "Please enter a text in the settings";
    }
    AdvancedMode = GM_getValue("jmpmode","no");
    if (AdvancedMode == "undefined"){
        AdvancedMode = "no";
    }
    CurrentLoungeSite = "none"
    if (window.location.href.indexOf("result") > -1) {
        Initialize.results();
        CurrentLoungeSite = "results";
    }
    if (window.location.href.indexOf("trade") > -1) {
        Initialize.trade();
        CurrentLoungeSite = "trades";
    }
    if (window.location.href.indexOf("myoffers") > -1) {
        Initialize.MyOffers();
        CurrentLoungeSite = "offers";
    }
    if (window.location.href.indexOf("match?") > -1) {
        Initialize.match();
        CurrentLoungeSite = "matchsite";
    }
    if (window.location.href.indexOf("mytrades") > -1) {
        Initialize.MyTrades();
        CurrentLoungeSite = "mytrades";
    }
    if (window.location.href.indexOf("#settings") > -1) {
        Initialize.Settings();
        CurrentLoungeSite = "settings";
    }
    if (window.location.href.indexOf("profile") > -1) {
        CurrentLoungeSite = "profile";
    }
    document.getElementsByTagName("body")[0].style["background"] = "#AEAEAE url('../img/subbg.jpg') repeat-y scroll 100% 0px"
}

Initialize.addElements = function() {
    var curElement = document.getElementById("menu");
    if (curElement){
        var settings = document.createElement('a');
        settings.setAttribute("class", "ap");
        settings.setAttribute("class", "ap");
        settings.innerHTML += "<img src='https://cdn4.iconfinder.com/data/icons/small-n-flat/24/wrench-128.png' style='width:40px;height:40px;' alt='Settings'>";
        settings.innerHTML += "settings";

        curElement.appendChild(settings);
        settings.addEventListener('click', function(mouseEvent) {
            var myWindow=window.open('http://csgolounge.com/#settings','','width=650,height=500,resizable=0,scrollbars=0,left=0,top=0');
        });
    }
}


Initialize.match = function () {
    function UpdateMatchHistory() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "http://csgolounge.com/api/matches.php",
            onload: function(response) {
                alert("Updated Match History");
                GM_setValue("matches",$.parseJSON(response.response));
            }
        });
    };

    if (GM_getValue("matches") == "undefined") {
        UpdateMatchHistory()
    }

    document.getElementsByTagName("span")[1].innerHTML = "<a id = 'refresh' style='font-size:10px'>refresh</a> <br>" + document.getElementsByTagName("span")[1].innerHTML;
    document.getElementById("refresh").addEventListener('click', function(mouseEvent) {
        UpdateMatchHistory();
    });

    var team1 = document.getElementsByTagName("span")[0].getElementsByTagName("b")[0].innerHTML.toString();
    var team2 = document.getElementsByTagName("span")[2].getElementsByTagName("b")[0].innerHTML.toString();

    team1 = team1.replace(" (win)","");
    team2 = team2.replace(" (win)","");


    var JSON_OBject = GM_getValue("matches");
    var teams = {}
    teams[team1] = {}
    teams[team1].matches = 0;
    teams[team1].won = 0;
    teams[team1].lost = 0;
    teams[team1].drawn = 0;
    teams[team1].ratio = 0;
    teams[team1].vsmatcheswon = 0;
    teams[team2] = {}
    teams[team2].matches = 0;
    teams[team2].won = 0;
    teams[team2].lost = 0;
    teams[team2].drawn = 0;
    teams[team2].ratio = 0;
    teams[team2].vsmatcheswon = 0;
    teams.vsmatches = 0;


    var today = new Date(useful.getTodaysDate()).getTime();
    var todayWithDaysBack = new Date(useful.getTodaysDate()).getTime() - (numberOfDaysBack * 24 * 60 * 60 * 1000);

    for (i = 0; i < JSON_OBject.length; i++) {
        var teama = JSON_OBject[i]["a"].toString();
        var teamb = JSON_OBject[i]["b"].toString();
        var matchday = new Date(JSON_OBject[i]["when"].replace("-","/").replace("-","/")).getTime();
        if (today > matchday) {
            if (matchday > todayWithDaysBack) {
                if (teama == team1 || teamb == team1) {
                    teams[team1].matches += 1;
                    if (teama == team1) {
                        if (JSON_OBject[i]["winner"] == "a") {
                            teams[team1].won += 1;
                        } else {
                            if (JSON_OBject[i]["winner"] == "") {
                                teams[team1].drawn += 1;
                            } else {
                                teams[team1].lost += 1;
                            }
                        }
                    } else if (teamb == team1) {
                        if (JSON_OBject[i]["winner"] == "b") {
                            teams[team1].won += 1;
                        } else {
                            if (JSON_OBject[i]["winner"] == "") {
                                teams[team1].drawn += 1;
                            } else {
                                teams[team1].lost += 1;
                            }
                        }
                    }
                } else if (teama == team2 || teamb == team2) {
                    teams[team2].matches += 1;
                    if (teama == team2) {
                        if (JSON_OBject[i]["winner"] == "a") {
                            teams[team2].won += 1;
                        } else {
                            if (JSON_OBject[i]["winner"] == "") {
                                teams[team2].drawn += 1;
                            } else {
                                teams[team2].lost += 1;
                            }
                        }
                    } else if (teamb == team2) {
                        if (JSON_OBject[i]["winner"] == "b") {
                            teams[team2].won += 1;
                        } else {
                            if (JSON_OBject[i]["winner"] == "") {
                                teams[team2].drawn += 1;
                            } else {
                                teams[team2].lost += 1;
                            }
                        }
                    }
                }

                if (teama == team1 && teamb == team2) {
                    teams.vsmatches += 1;
                    if (teama == team2) {
                        if (JSON_OBject[i]["winner"] == "a") {
                            teams[team2].vsmatcheswon += 1;
                        }
                    } else if (teamb == team2) {
                        if (JSON_OBject[i]["winner"] == "b") {
                            teams[team2].vsmatcheswon += 1;
                        }
                    }
                    if (teama == team1) {
                        if (JSON_OBject[i]["winner"] == "a") {
                            teams[team1].vsmatcheswon += 1;
                        }
                    } else if (teamb == team1) {
                        if (JSON_OBject[i]["winner"] == "b") {
                            teams[team1].vsmatcheswon += 1;
                        }
                    }
                } else if (teama == team2 && teamb == team1) {
                    teams.vsmatches += 1;
                    if (teama == team2) {
                        if (JSON_OBject[i]["winner"] == "a") {
                            teams[team2].vsmatcheswon += 1;
                        }
                    } else if (teamb == team2) {
                        if (JSON_OBject[i]["winner"] == "b") {
                            teams[team2].vsmatcheswon += 1;
                        }
                    }
                    if (teama == team1) {
                        if (JSON_OBject[i]["winner"] == "a") {
                            teams[team1].vsmatcheswon += 1;
                        }
                    } else if (teamb == team1) {
                        if (JSON_OBject[i]["winner"] == "b") {
                            teams[team1].vsmatcheswon += 1;
                        }
                    }
                }
            }
        }
    }

    teams[team1].ratio = (100/teams[team1].matches * teams[team1].won).toFixed(2);
    teams[team2].ratio = (100/teams[team2].matches * teams[team2].won).toFixed(2);

    var fullbar = document.getElementsByClassName("full")[0];
    var spoiler_bar = document.createElement('div');
    spoiler_bar.setAttribute('id',"bet_stats");
    spoiler_bar.style["cursor"] = "pointer";
    spoiler_bar.style["width"] = "50%";
    spoiler_bar.style["height"] = "13px";
    spoiler_bar.style["overflow"] = "hidden";
    spoiler_bar.innerHTML = "<div id='bet_stats_title'>Team Stats ( click to expand )</div>";
    fullbar.appendChild(spoiler_bar);
    fullbar.insertBefore(spoiler_bar, fullbar.childNodes[0]);

    var team1_display = document.createElement('div');
    team1_display.setAttribute('id',"bet_stats");
    team1_display.style["cursor"] = "pointer";
    team1_display.style["margin-top"] = "12px";
    team1_display.style["width"] = "46.5%";
    team1_display.style["height"] = "50%";
    team1_display.style["float"] = "left";
    team1_display.style["background-color"] = "darkgreen";
    team1_display.innerHTML = team1 + " <p style='font-size:10px;'>data from the last "+numberOfDaysBack+" days </p>";
    spoiler_bar.appendChild(team1_display);




    // creating statistics for team1
    if (teams[team1].matches >= 1) {
        var team1_matches_played = document.createElement('div');
        team1_matches_played.style["padding-top"] = "6px";
        team1_matches_played.style["text-align"] = "center";
        team1_matches_played.style["font-size"] = "11px";
        team1_matches_played.innerHTML = teams[team1].matches+" Matches Played";
        team1_display.appendChild(team1_matches_played);

        var team1_matches_won = document.createElement('div');
        team1_matches_won.style["padding-top"] = "6px";
        team1_matches_won.style["text-align"] = "center";
        team1_matches_won.style["font-size"] = "11px";
        team1_matches_won.innerHTML = teams[team1].won+" Matches Won";
        team1_display.appendChild(team1_matches_won);

        var team1_matches_lost = document.createElement('div');
        team1_matches_lost.style["padding-top"] = "6px";
        team1_matches_lost.style["text-align"] = "center";
        team1_matches_lost.style["font-size"] = "11px";
        team1_matches_lost.innerHTML = teams[team1].lost+" Matches Lost";
        team1_display.appendChild(team1_matches_lost);


        if (teams[team1].drawn >= 1) {
            var team1_matches_drawn = document.createElement('div');
            team1_matches_drawn.style["padding-top"] = "6px";
            team1_matches_drawn.style["text-align"] = "center";
            team1_matches_drawn.style["font-size"] = "11px";
            team1_matches_drawn.innerHTML = teams[team1].drawn + " Matches Drawn";
            team1_display.appendChild(team1_matches_drawn);
        }

        var team1_winratio= document.createElement('div');
        team1_winratio.style["padding-top"] = "6px";
        team1_winratio.style["text-align"] = "center";
        team1_winratio.style["font-size"] = "11px";
        team1_winratio.innerHTML = teams[team1].ratio + "% Winratio";
        team1_display.appendChild(team1_winratio);
    } else {
        var team1_info= document.createElement('div');
        team1_info.style["padding-top"] = "6px";
        team1_info.style["text-align"] = "center";
        team1_info.style["font-size"] = "11px";
        team1_info.innerHTML = "No Data for this Team"
        team1_display.appendChild(team1_info);

    }


    var team2_display = document.createElement('div');
    team2_display.setAttribute('id',"bet_stats");
    team2_display.style["cursor"] = "pointer";
    team2_display.style["margin-top"] = "12px";
    team2_display.style["width"] = "46.5%";
    team2_display.style["height"] = "50%";
    team2_display.style["float"] = "right";
    team2_display.style["background-color"] = "darkgreen";
    team2_display.innerHTML = team2 + " <p style='font-size:10px;'>data from the last "+numberOfDaysBack+" days </p>";;
    spoiler_bar.appendChild(team2_display);


    // creating statistics for team2
    if (teams[team2].matches >= 1) {
        var team2_matches_played = document.createElement('div');
        team2_matches_played.style["padding-top"] = "6px";
        team2_matches_played.style["text-align"] = "center";
        team2_matches_played.style["font-size"] = "11px";
        team2_matches_played.innerHTML = teams[team2].matches + " Matches Played";
        team2_display.appendChild(team2_matches_played);

        var team2_matches_won = document.createElement('div');
        team2_matches_won.style["padding-top"] = "6px";
        team2_matches_won.style["text-align"] = "center";
        team2_matches_won.style["font-size"] = "11px";
        team2_matches_won.innerHTML = teams[team2].won + " Matches Won";
        team2_display.appendChild(team2_matches_won);

        var team2_matches_lost = document.createElement('div');
        team2_matches_lost.style["padding-top"] = "6px";
        team2_matches_lost.style["text-align"] = "center";
        team2_matches_lost.style["font-size"] = "11px";
        team2_matches_lost.innerHTML = teams[team2].lost + " Matches Lost";
        team2_display.appendChild(team2_matches_lost);

        if (teams[team2].drawn >= 1) {
            var team2_matches_drawn = document.createElement('div');
            team2_matches_drawn.style["padding-top"] = "6px";
            team2_matches_drawn.style["text-align"] = "center";
            team2_matches_drawn.style["font-size"] = "11px";
            team2_matches_drawn.innerHTML = teams[team2].drawn + " Matches Drawn";
            team2_display.appendChild(team2_matches_drawn);
        }

        var team2_winratio= document.createElement('div');
        team2_winratio.style["padding-top"] = "5px";
        team2_winratio.style["text-align"] = "center";
        team2_winratio.style["font-size"] = "11px";
        team2_winratio.innerHTML = teams[team2].ratio + "% Winratio";
        team2_display.appendChild(team2_winratio);
    } else {
        var team2_info= document.createElement('div');
        team2_info.style["padding-top"] = "6px";
        team2_info.style["text-align"] = "center";
        team2_info.style["font-size"] = "11px";
        team2_info.innerHTML = "No Data for this Team"
        team2_display.appendChild(team2_info);
    }



    var versus_display = document.createElement('div');
    versus_display.setAttribute('id',"bet_stats");
    versus_display.style["cursor"] = "pointer";
    versus_display.style["width"] = "97.5%";
    versus_display.style["height"] = "24%";
    versus_display.style["float"] = "left";
    versus_display.style["background-color"] = "#810083";
    versus_display.innerHTML = "<p style='font-size:10px;'> " + team1 + " vs " +team2 +" stats </p>"  + " <p style='font-size:10px;'>data from the last "+numberOfDaysBack+" days </p>";
    spoiler_bar.appendChild(versus_display);

    if (teams.vsmatches >= 1) {
        var versus_matches_played = document.createElement('div');
        versus_matches_played.style["padding-top"] = "2px";
        versus_matches_played.style["text-align"] = "center";
        versus_matches_played.style["font-size"] = "11px";
        versus_matches_played.innerHTML = teams.vsmatches + " Matches Played against eachother";
        versus_display.appendChild(versus_matches_played);


        var versus_won_team1 = document.createElement('div');
        versus_won_team1.style["padding-top"] = "5px";
        versus_won_team1.style["text-align"] = "center";
        versus_won_team1.style["float"] = "left";
        versus_won_team1.style["padding-left"] = "2px";
        versus_won_team1.style["font-size"] = "11px";
        versus_won_team1.innerHTML = team1 + " won " + teams[team1].vsmatcheswon + " of them";
        versus_display.appendChild(versus_won_team1);

        var versus_won_team2 = document.createElement('div');
        versus_won_team2.style["padding-top"] = "5px";
        versus_won_team2.style["text-align"] = "center";
        versus_won_team2.style["float"] = "right";
        versus_won_team2.style["padding-right"] = "2px";
        versus_won_team2.style["font-size"] = "11px";
        versus_won_team2.innerHTML = team2 + " won " + teams[team2].vsmatcheswon + " of them";
        versus_display.appendChild(versus_won_team2);


    } else {
        var versus_info = document.createElement('div');
        versus_info.style["padding-top"] = "5px";
        versus_info.style["text-align"] = "center";
        versus_info.style["padding-right"] = "2px";
        versus_info.style["font-size"] = "11px";
        versus_info.innerHTML = "No Versus Data for this two Teams";
        versus_display.appendChild(versus_info);
    }



    spoiler_bar.addEventListener("click", function (event) {
        var box = $(this);
        if(box.hasClass("opened")){
            box.css({"width":"50%","height":"13","overflow":"hidden"});
            $("#bet_stats_title").html("Team Stats ( click to expand )");
            box.removeClass("opened");
        } else if (!box.hasClass("opened")){
            box.css({"width":"50%","height":"200","overflow":"visible"});
            box.addClass("opened");
            $("#bet_stats_title").html("Team Stats ( click to retract )");
        };
    });

    GM_addStyle("#bet_stats {text-align:center;font-size:12px;margin:auto;border-radius: 5px;padding:5px 5px 5px 5px;margin-bottom:8px;background-color:#808080}")
}

Initialize.MyTrades = function () {
    if ( window.location.href.indexOf("#autobump") > -1){
        setInterval(function(){
            window.location.reload(true);
        },1000*60*5);
    }

    var m_t_list = document.getElementsByClassName("standard")[0];
    var m_t_btn = document.createElement('div');
    m_t_btn.setAttribute('class',"button");
    m_t_btn.style["cursor"] = "pointer";
    m_t_list.appendChild(m_t_btn);
    if ( window.location.href.indexOf("#autobump") > -1){
        m_t_btn.innerHTML = "Deactivate AutoBump";
    } else {
        m_t_btn.innerHTML = "Activate AutoBump";
    }

    m_t_list.insertBefore(m_t_btn, m_t_list.childNodes[0]);

    m_t_btn.addEventListener("click", function (event) {
        if ( window.location.href.indexOf("#autobump") > -1){
            window.location.href = "http://csgolounge.com/mytrades";
        }else{
            window.location.href = "http://csgolounge.com/mytrades#autobump";
            window.location.reload(true);
        }
    });

    var m_t_b_array = m_t_list.getElementsByClassName("buttonright");
    for (var i = 0; i < m_t_b_array.length; i++) {
        m_t_b_array[i].click();
    }
}

Initialize.openTrade = function (url){
    window.open(url, "_blank", "width=1,height=1,resizable=yes,scrollbars=yes,left=2400,top=0")

    GM_setValue("open_trades",GM_getValue("open_trades",0) + 1);
    window.focus();
}

Initialize.results = function () {
    GM_setValue("open_trades",0);
    var box = document.getElementsByClassName("box")[0];
    var list = document.getElementById("tradelist")

    var advmod = document.createElement('div');
    advmod.setAttribute('class',"button");

    advmod.setAttribute('id',"automodebtn");
    advmod.style["cursor"] = "pointer";
    box.appendChild(advmod);
    advmod.innerHTML = "Auto="+AdvancedMode;
    list.insertBefore(advmod, list.childNodes[0]);

    advmod.addEventListener("click", function (event) {
        if (AdvancedMode == "no"){
            GM_setValue("jmpmode","yes");
            AdvancedMode = "yes";
        } else {
            GM_setValue("jmpmode","no");
            AdvancedMode = "no";
        }
        advmod.innerHTML = "Auto="+AdvancedMode;
    });

    var scrapetrades = document.createElement('div');
    scrapetrades.setAttribute('class',"button");
    scrapetrades.style["cursor"] = "pointer";
    box.appendChild(scrapetrades);

    scrapetrades.innerHTML = "Scrape Trades";
    list.insertBefore(scrapetrades, list.childNodes[0]);



    scrapetrades.addEventListener("click", function (event) {
        var trades = document.getElementsByClassName("tradepoll");
        var curElement;

           for (var i = 0; i < trades.length; i++) {
               if (trades[i].getElementsByClassName("tradeheader")) {
                   curElement = trades[i].getElementsByClassName("tradeheader")[0];
                   curElement.style.height = "25px";
                       if (curElement.getElementsByTagName("a")){
                           curElement = curElement.getElementsByTagName("a")[1];
                           if (WaitBeforeOffers == "1"){
                               alert("#"+(trades.length-i)+" Open Trade "+curElement.getAttribute("href"));
                           };

                            trades[i].style["opacity"] = "0.5";
                           Initialize.openTrade(curElement.getAttribute("href"));
                          }
                  }
             }
        if (GM_getValue("jmpmode","no") == "yes"){
            var gInterval = setInterval(function () {
                if (GM_getValue("open_trades",0) == 0){
                    clearInterval(gInterval);
                    useful.nextSite();
                }
            },1000);

        }
    });

    if ( window.location.href.indexOf("#auto") > -1){
           scrapetrades.click();
    } else {
        GM_setValue("jmpmode","no");
        AdvancedMode = "no";
    }
}

Initialize.trade = function () {
    var posted = 0;
    if (window.opener != null){
        var text = document.body.textContent || document.body.innerText;
        if (text.search(Nickname) == -1) {
            window.onload = function () {
                if (document.body.innerHTML.search("textarea") == -1) {
                    GM_setValue("open_trades",GM_getValue("open_trades",0) -1 );
                    window.close();
                    console.log("Window closed, trade maybe removed ?");
                }

                if (document.getElementById("offer")){
                    curElement = document.getElementById("offer");
                    if (!curElement.getElementsByClassName("button")[0]){
                        GM_setValue("open_trades",GM_getValue("open_trades",0) -1 );
                        console.log(GM_getValue("open_trades",0));
                        window.close();
                        console.log("Window closed, trade maybe removed ?");
                    }
                    if (curElement.getElementsByTagName("textarea")[0]){
                        curElement.getElementsByTagName("textarea")[0].value = TextToSend;
                        console.log("Added offertext to trade");
                    }
                    if (curElement.getElementsByClassName("left")[0]){
                        var classElement = curElement.getElementsByClassName("left")[0];
                        classElement.style.removeProperty("display");
                        if (ItemInOffer != ""){
                            ItemInOffer = useful.SplitString(ItemInOffer);
                            console.log("Adding items to trade : "+ItemInOffer.join())
                            for (var i in ItemInOffer) {
                                if (ItemInOffer[i] == "") {
                                    return;
                                }

                                var oitm = document.createElement('div');
                                oitm.setAttribute('class',"oitm");
                                classElement.appendChild(oitm);

                                var div = document.createElement('div');
                                div.setAttribute('class',"item");
                                oitm.appendChild(div);

                                var div = document.createElement('input');
                                div.setAttribute('type',"hidden");
                                div.setAttribute('value',ItemInOffer[i]);
                                div.setAttribute('name',"ldef_index[]");
                                oitm.appendChild(div);


                                var div = document.createElement('input');
                                div.setAttribute('type',"hidden");
                                div.setAttribute('value',"0");
                                div.setAttribute('name',"lquality[]");
                                oitm.appendChild(div);


                                var div = document.createElement('input');
                                div.setAttribute('type',"hidden");
                                div.setAttribute('value',"");
                                div.setAttribute('name',"id[]");
                                oitm.appendChild(div);
                            }
                        }
                        if (curElement.getElementsByClassName("button")[0]){
                            curElement = curElement.getElementsByClassName("button")[0];
                            setTimeout(function (){
                                curElement.click();
                                posted = 1;
                                setTimeout(function (){
                                    if (WindowCanTimeout == 1) {
                                        GM_setValue("open_trades",GM_getValue("open_trades",0) -1 );

                                        window.close();
                                    } else {
                                        document.location.reload();
                                    }
                                    console.log("Window reloaded/closed after '"+WindowTimeOut/1000+"s' of no activity ");
                                },WindowTimeOut);
                            },1500)
                            console.log("Clicking 'post reply' button and setting timeout ("+WindowTimeOut/1000+"s)");
                        }
                    }
                }
            }
        } else {
            GM_setValue("open_trades",GM_getValue("open_trades",0) -1 );
            window.close();

            console.log("Window closed,post already found");
        }
        if (posted == 0) {
            setTimeout(function (){
                document.location.reload();
            },WindowTimeOut);
        }
    }
}

Initialize.MyOffers = function () {
    var box = document.getElementsByClassName("box")[0];
    var scrapeoffers = document.createElement('div');
    scrapeoffers.setAttribute('class',"button");
    scrapeoffers.style["cursor"] = "pointer";
    box.appendChild(scrapeoffers);

    scrapeoffers.innerHTML = "Remove all offers";
    var list = document.getElementById("tradelist")
    list.insertBefore(scrapeoffers, list.childNodes[0]);
    scrapeoffers.addEventListener("click", function (event) {
        var tradeoffercount = document.getElementsByClassName("tradepoll");
        var curElement;
        console.log("Found : "+tradeoffercount.length+" offers to delete");
        for (var i = 0; i < tradeoffercount.length; i++) {
           if (tradeoffercount[i].getElementsByClassName("tradeheader")) {
               curElement = tradeoffercount[i].getElementsByClassName("tradeheader")[0];
                  if (curElement.getElementsByTagName("span")[1]){
                      curElement = curElement.getElementsByTagName("span")[1];
                       if (curElement.getElementsByClassName("button")[0]){
                           curElement = curElement.getElementsByClassName("button")[0];
                           curElement.click();
                           curElement.click();
                           console.log("deleted offer : "+i);

                       }
                  }
              }
         }
    });
}

Initialize.Settings = function () {
    $(document).ready(function() {
        document.body.removeAttribute("style");
        document.body.style["background"] = "lightgrey";
    });

    //document.head.innerHTML = "";
    document.body.innerHTML = "";
    document.body.style["background"] = "darkgreen";
    document.head.style["background"] = "darkgreen";

    var curElement = document.getElementsByTagName("body")[0]
    if (curElement){
        var offertext = document.createElement('textarea');
        offertext.setAttribute('placeholder',"Enter your text here");
        offertext.style.width = "100%";
        offertext.setAttribute('value',GM_getValue("offertext"));
        offertext.setAttribute('id',"offertext");
        curElement.appendChild(offertext);
        if (GM_getValue("offertext")){
            offertext.value = GM_getValue("offertext");
        };

        var setOfferText = document.createElement('div');
        setOfferText.setAttribute('class',"button");
        setOfferText.style["cursor"] = "pointer";

        setOfferText.innerHTML = "Set offer Text";
        curElement.appendChild(setOfferText);


        setOfferText.addEventListener("click", function (event) {
            GM_setValue("offertext",offertext.value);
            alert("Saved");
        });


        var offeritems = document.createElement('textarea');
        offeritems.setAttribute('placeholder',"Enter your Items here , example itemid,itemid..");
        offeritems.style["margin-top"] = "25px";
        offeritems.style["width"] = "100%";
        offeritems.setAttribute('value',"");
        offeritems.setAttribute('id',"offertext");
        curElement.appendChild(offeritems);
        if (GM_getValue("offeritems")){
            offeritems.value = GM_getValue("offeritems");
        };

        var div = document.createElement('div');
        div.setAttribute('class',"button");
        div.style["cursor"] = "pointer";

        div.innerHTML = "Set offer items";
        curElement.appendChild(div);


        div.addEventListener("click", function (event) {
            if (offeritems.value == "") {
                GM_setValue("offeritems","");
            }
            GM_setValue("offeritems",offeritems.value);
            alert("Saved");
        });

        var ctext = document.createElement('textarea');
        ctext.setAttribute('placeholder',"Enter your nickname here, used for getting your posts!");
        ctext.style["margin-top"] = "25px";
        ctext.style["width"] = "100%";
        ctext.setAttribute('value',"");
        ctext.setAttribute('id',"Nickname");
        curElement.appendChild(ctext);
        if (GM_getValue("Nickname")){
            ctext.value = GM_getValue("Nickname","None");
        };

        var div1 = document.createElement('div');
        div1.setAttribute('class',"button");
        div1.style["cursor"] = "pointer";

        div1.innerHTML = "Set Nickname";
        curElement.appendChild(div1);


        div1.addEventListener("click", function (event) {
            if (ctext.value == "") {
                GM_setValue("Nickname","None");
            }
            GM_setValue("Nickname",ctext.value);
            alert("Saved");
        });

    }

    var dback_text = document.createElement('textarea');
    dback_text.setAttribute('placeholder',"Please enter the the amount of days you want the statistic of each team to check");
    dback_text.style["margin-top"] = "25px";
    dback_text.style["width"] = "100%";
    dback_text.setAttribute('value',"");
    dback_text.setAttribute('id',"DaysBack");
    curElement.appendChild(dback_text);
    if (GM_getValue("daysback")){
        dback_text.value = GM_getValue("daysback",15);
    };

    var approveBTN = document.createElement('div');
    approveBTN.setAttribute('class',"button");
    approveBTN.style["cursor"] = "pointer";

    approveBTN.innerHTML = "Set Day-Range";
    curElement.appendChild(approveBTN);


   approveBTN.addEventListener("click", function (event) {
      if (dback_text.value == "") {
           GM_setValue("daysback",15);
       }
       GM_setValue("daysback",dback_text.value);
       alert("Saved");
       console.log("Changed 'daysback'");
   });
}

Initialize.ini();

GM_addStyle(".ap { font-size : 12.8px }");
