var session_list = null;
var selected_session_id = null
var open_tab_ids = {}
var control_tab_id = null
var MASTER_ENABLE_STATUS = true
var username = "Default"


//chrome.storage.local.set({sessions: []});  //testing
chrome.storage.local.get(function (item) {
    if (chrome.runtime.lastError || !item.hasOwnProperty("sessions")) {
        session_list = []
    } else {

        session_list = item.sessions;
	if(typeof item.username !== "undefined")
	username = item.username
	if(item.hasOwnProperty('MASTER_ENABLE_STATUS') && typeof item.MASTER_ENABLE_STATUS !== 'undefined'){
	    MASTER_ENABLE_STATUS = item.MASTER_ENABLE_STATUS
	 

	}
    }

    
}.bind(this));


function load_storage() {
 
}


browser.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if(control_tab_id == tabId)
	control_tab_id = null
    else{
	for (var key in open_tab_ids) {
	    if(open_tab_ids[key] == tabId){
		delete open_tab_ids[key]
	    }

	}
    }
    
});

//START PORT LISTENER ************************

browser.runtime.onMessage.addListener(function (msg, sender, sendResponse) {



    if(msg.type == "SHOW_CONTROL_TAB"){

	save_state()
	if(control_tab_id != null)
	browser.tabs.remove(control_tab_id)
browser.tabs.create({url: browser.extension.getURL("controls.htm")}).then(function(tab){

    control_tab_id = tab.id})
	
}    else    if(msg.type =="NEW_PAGE_BROADCAST"){


    }else if(msg.type =="READY_CONTROLS"){
	
	sendResponse({response:session_list,
		      status: MASTER_ENABLE_STATUS,
		      username:username})


    }else if(msg.type =="PAGE_ENABLE_DISABLE_STATUS"){

	MASTER_ENABLE_STATUS = msg.status
	if(control_tab_id != null){
	    browser.tabs.sendMessage(control_tab_id, {type: "PAGE_ENABLE_DISABLE_STATUS",  status:MASTER_ENABLE_STATUS})
	}

	for (var key in open_tab_ids) {
	    if(open_tab_ids[key] != sender.tab.id)
	   browser.tabs.sendMessage(open_tab_ids[key], {type: "PAGE_ENABLE_DISABLE_STATUS",  status:MASTER_ENABLE_STATUS})
	}
	


    }else if(msg.type =="KILL_TAB"){
	
	if(open_tab_ids.hasOwnProperty(msg.num)){
	    browser.tabs.remove(open_tab_ids[msg.num])
	    delete open_tab_ids[msg.num]
	}
	
    }else if(msg.type =="READY_PAGE"){

	
	if(open_tab_ids.hasOwnProperty(msg.num)){

	    browser.tabs.remove(open_tab_ids[msg.num])
	    delete open_tab_ids[msg.num]
	  
	}

	open_tab_ids[msg.num] = sender.tab.id

	
	var num = msg.num
	var resp = {items:[], comments:[], username:username}
	
	var sess = null
	if(selected_session_id != null){

	    for(var i = 0; i < session_list.length;i++){
		if(session_list[i].id == selected_session_id){
		    sess = session_list[i]; break; 
		}
	    }
	}

	if(sess != null){
	    for(var i = 0; i < sess.assets.length; i++){

		if(sess.assets[i].num == num){
		    resp.items = sess.assets[i].items
		    resp.comments = sess.assets[i].comments 
		    break;
		}
	    }
	}
	
	sendResponse({response:resp, MASTER_ENABLE_STATUS:MASTER_ENABLE_STATUS})

    }

    else if (msg.type === "CONTROLS_UPDATE") {
        // saveFile("uspto_results.json", JSON.stringify(data))
	var old_session_list = session_list
	session_list = msg.session_list
	var new_uname = msg.username


	//change username:
	if(new_uname != username){
	 
	    username = new_uname

	    for(var k in open_tab_ids){
		    browser.tabs.reload(open_tab_ids[k])
	    }
	    
	}
	
	
	selected_session_id = msg.selected_session_id

	
	if(JSON.stringify(old_session_list) != JSON.stringify(session_list)){
	    //THERE HAVE BEEN CHANGES

	    save_state()

	    //update other pages
	    var the_sel = null
	    for(var i = 0; i < session_list.length; i++){
		if(session_list[i].id == selected_session_id){
		    the_sel = session_list[i]; break;
		}
	    }
	    for(var i = 0; i < the_sel.assets.length; i++){
	//	browser.runtime.sendMessage({type: "INDEX_TO_PAGES_UPDATE_BROADCAST",  asset:the_sel.assets[i]})		
	    }

	}

	save_state()
    }
        
});

//END PORT LISTENER ***********************
			

browser.tabs.create({url: browser.extension.getURL("controls.htm")}).then(function(tab){

    control_tab_id = tab.id
    
   // browser.tabs.create({url: "http://appft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HITOFF&d=PG01&p=1&u=%2Fnetahtml%2FPTO%2Fsrchnum.html&r=1&f=G&l=50&s1=%2220010000044%22.PGNR.&OS=DN/20010000044&RS=DN/20010000044"}).then(()=>{			   			})
			

			 

})


function save_state(){

    var saving = {selected_session_id: selected_session_id, "MASTER_ENABLE_STATUS": MASTER_ENABLE_STATUS, sessions: session_list, username:username}


    chrome.storage.local.set(saving);


}


