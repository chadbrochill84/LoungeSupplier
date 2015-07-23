// ==UserScript==
// @name               CSGOLounge Lounge Supplier
// @namespace          CSGOLounge Lounge Supplier
// @author             Z8pn
// @author_steam       http://steamcommunity.com/profiles/76561198142908602
// @description  Simplifies trading Items by mass posting a given text and more :)
// @include            /^http(s)?://(www.)?csgolounge.com//
// @require http://code.jquery.com/jquery-2.1.1.js
// @grant              GM_addStyle
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM_xmlhttpRequest
// ==/UserScript==

var Nickname;
var ItemInOffer;
var TextToSend;
var CurrentLoungeSite;
var CurrentMatches = {};
var WaitBeforeOffers = 0; // Message box after each pop-up ?
var WindowTimeOut = 5000; // MS after the window gets closed if the offer wasn´t posted
var WindowCanTimeout = 0; // Window closes itself if no response.

var useful = {};
var Initialize = {};

useful.getUrlPart = function( name, url ) {
      if (!url) url = location.href
      name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
      var regexS = "[\\?&]"+name+"=([^&#]*)";
      var regex = new RegExp( regexS );
      var results = regex.exec( url );
      return results == null ? null : results[1];
}

useful.InsertAfter = function (newElement,targetElement) {
    //target is what you want it to go after. Look for this elements parent.
    var parent = targetElement.parentNode;

    //if the parents lastchild is the targetElement...
    if(parent.lastchild == targetElement) {
        //add the newElement after the target element.
        parent.appendChild(newElement);
        } else {
        // else the target has siblings, insert the new element between the target and it's next sibling.
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
             }else{
                 
					GM_setValue("jmpmode","no");
					AdvancedMode = "no";
					var btn = document.getElementById("automodebtn")
					btn.innerHTML = "Auto="+AdvancedMode;
             }
}
useful.SplitString = function (CommaSepStr) {
        var ResultArray = []; 
        var SplitChars = ',';
        if (CommaSepStr!= null) {
            if (CommaSepStr.search(",") == -1) {
                ResultArray.splice(1, 0, CommaSepStr);
            }else{
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
    if (window.location.href.indexOf("csgolounge.com") > -1 & CurrentLoungeSite == "none") {   
		Initialize.MatchesLookup();
		
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
            var myWindow=window.open('http://csgolounge.com/#settings','','width=600,height=360,resizable=0,scrollbars=0,left=0,top=0');

        });
    }

};


Initialize.MatchesLookup = function () {
console.log("Asking for Notification permission");
	Notification.requestPermission(function (status) {
      if (Notification.permission !== status) {
        Notification.permission = status;
      }
    });
	
	
console.log("Setting up Match Lookup");
  $('.matchmain', document.body.innerHTML).each(function(index, value) {
        if (!$('.match', value).hasClass('notaviable')) {
            var matchid = value.getElementsByTagName("a")[0]
			var matchid = matchid.href.replace("http://csgolounge.com/", "");
            CurrentMatches[matchid] = true;
        }
    });

setInterval(function(){
	GM_xmlhttpRequest({
	  method: "GET",
	  url: "http://csgolounge.com/",
	  onload: function(response) {
				var doc = document.implementation.createHTMLDocument('');
				doc.body.innerHTML = response.responseText;
			    Initialize.NewMatch(doc);
	  }
	});

}, 1000*60*5);
}

Initialize.NewMatch = function ( response ) {
   var activeMatches = {};

    $('.matchmain', response).each(function(index, value) {
        if (!$('.match', value).hasClass('notaviable')) {
            var matchid = value.getElementsByTagName("a")[0]
            activeMatches[matchid.href] = true;
        }
    });
	
    if ($.isEmptyObject(activeMatches)) {
        return false;
    }

        var newMatchStorageObject = CurrentMatches;
        var newMatchesCount = 0;

        $.each(activeMatches, function(index, value) {
            if (typeof newMatchStorageObject[index] == 'undefined') {
                console.log('Match #' + index + ' is new, adding to notify list and saving in local storage.');
                newMatchStorageObject[index] = true;
                newMatchesCount++;
            }
        });

		CurrentMatches = newMatchStorageObject ;

        if (newMatchesCount >= 1) {
		
				if (window.Notification && Notification.permission === "granted") {
						  var options = {
							  body: "A new CS:GO match has been added!"
						  }
						  new Notification("New Match",options);
				}
				else if (window.Notification && Notification.permission !== "denied") {
					Notification.requestPermission(function (status) {
						if (Notification.permission !== status) {
						  Notification.permission = status;
						}
						if (status === "granted") {
							var options = {
							  body: "A new CS:GO match has been added!"
						  }
						  new Notification("New Match",options);
						}
					});
				}	
			}

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
    }else{
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
		
	var m_t_b_array = m_t_list.getElementsByClassName("buttonright")
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
            }else{
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
    }else{
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
													}else{
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
               }else{
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
	   document.head.innerHTML = "";
       document.body.innerHTML = "";
       document.body.style.background = "#D7D7D7";
        
       var curElement = document.getElementsByTagName("body")[0]
       if (curElement){
       
       var offertext = document.createElement('textarea');
          offertext.setAttribute('placeholder',"Enter your text here"); 
          offertext.style.width = "580px";
          offertext.setAttribute('value',GM_getValue("offertext"));
          offertext.setAttribute('id',"offertext");
       curElement.appendChild(offertext);
          if (GM_getValue("offertext")){
              offertext.value = GM_getValue("offertext");   
          };

       var setOfferText = document.createElement('div');
       setOfferText.setAttribute('class',"fbutton");

          setOfferText.innerHTML = "Set offer Text";
       curElement.appendChild(setOfferText);
           
           setOfferText.addEventListener("mouseover", function (event) {
                setOfferText.style["background-color"] = "#808080";
           });
           setOfferText.addEventListener("mouseleave", function (event) {
                setOfferText.style["background-color"] = "#C0C0C0";
           });
           
           setOfferText.addEventListener("click", function (event) {
               GM_setValue("offertext",offertext.value);
               alert("Text Saved");
               console.log("Changed offer-text");
           });
           
           
       var offeritems = document.createElement('textarea');
          offeritems.setAttribute('placeholder',"Enter you Items here , example itemid,itemid.."); 
          offeritems.style["margin-top"] = "25px";
          offeritems.style["width"] = "580px";
          offeritems.setAttribute('value',"");
          offeritems.setAttribute('id',"offertext");
       curElement.appendChild(offeritems);
          if (GM_getValue("offeritems")){
              offeritems.value = GM_getValue("offeritems");   
          };
       
       var div = document.createElement('div');
       div.setAttribute('class',"fbutton");
 
          div.innerHTML = "Set offer items";
       curElement.appendChild(div);
           
           div.addEventListener("mouseover", function (event) {
                div.style["background-color"] = "#808080";
           });
           div.addEventListener("mouseleave", function (event) {
                div.style["background-color"] = "#C0C0C0";
           });
           
           div.addEventListener("click", function (event) {
              if (offeritems.value == "") {
                   GM_setValue("offeritems","");
               }
               GM_setValue("offeritems",offeritems.value);
               alert("Items Saved");
               console.log("Changed offer-items");
           });
           
           
           

          var ctext = document.createElement('textarea');
          ctext.setAttribute('placeholder',"Enter you nickname here, used for getting your posts!"); 
          ctext.style["margin-top"] = "25px";
          ctext.style["width"] = "580px";
          ctext.setAttribute('value',"");
          ctext.setAttribute('id',"Nickname");
       curElement.appendChild(ctext);
          if (GM_getValue("Nickname")){
              ctext.value = GM_getValue("Nickname","None");   
          };
       
       var div1 = document.createElement('div');
       div1.setAttribute('class',"fbutton");
 
          div1.innerHTML = "Set Nickname";
       curElement.appendChild(div1);
           
           div1.addEventListener("mouseover", function (event) {
                div1.style["background-color"] = "#808080";
           });
           div1.addEventListener("mouseleave", function (event) {
                div1.style["background-color"] = "#C0C0C0";
           });
           
           div1.addEventListener("click", function (event) {
              if (ctext.value == "") {
                   GM_setValue("Nickname","None");
               }
               GM_setValue("Nickname",ctext.value);
               alert("Nickname Saved");
               console.log("Changed Nickname");
           });
           
       }
}
Initialize.ini();


GM_addStyle(".offerstats {margin:auto;padding:5px 5px 5px 10px;background-color:#808080;width:150px;text-align:center;}")
GM_addStyle(".ap { font-size : 12.8px }");
GM_addStyle(".fbutton { cursor:pointer;text-align:center;font-family:Verdana, 'Lucida Sans Unicode', sans-serif;width:150px;background-color:#C0C0C0;padding:5px 10px 5px 10px; }");
