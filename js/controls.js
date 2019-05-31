//REQUIRE AT LEAST ONE SESSION
//ADD DISABLE / ENABLE TOGGLE

var ID_CNT = 0;
var session_list = []
var username = "Default"
var selected_session = null
var old_selected_session_txt = null
//HANDLE INCOMING MESSAGES

browser.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

    if(msg.type == "PAGE_ENABLE_DISABLE_STATUS"){
	$( "#radio_enable" ).prop( "checked", msg.status );
	$( "#radio_disable" ).prop( "checked", !msg.status );
    }
    else if(msg.type == "PAGE_TO_CONTROL_UPDATE"){

	if(selected_session == null){
	   
	    return;
	}

	
	//num exists?  if not add.  if so, update and refresh.
	var exists = false;
	var a = null
	for(var i = 0; i < selected_session.assets.length; i++){
	    a = selected_session.assets[i];
	    if(a.num == msg.num){
		exists = true
		
		a.items = msg.items;
		a.comments = msg.comments;
		a.origin_tab = msg.origin_tab
		break;
	    }
	}
	if(!exists){
	    selected_session.assets.push({num: msg.num, items:msg.items, comments:msg.comments, origin_tab:msg.origin_tab, asset_note:""})
	}

	refresh_session_assets()
	send_update()
	$("#session_ele_cnt_"+selected_session.id).html(selected_session.assets.length)
    }
})
//RECEIVE saved Data
//Update
//Save state

//SEND MESSAGES


$(document).ready(function () {

    //file stuff
    $("body").css("padding", "0px")

    var bulk = $('<div id="bulk_add" style="position:absolute; top:0px; left;0px; width:100%; height:100%; z-index:5; background-color:rgba(0,0,0,.5); display:relative; box-sizing:border-box; padding:10px;"></div>')
    var d = $('<div style="border:1px solid black; background-color:#ddd; border: 1px solid black; border-radius:10px; width:100%; height:100%; top:0px; left:0px; display:flex;flex-direction:column"></div>')
    bulk.append(d)
    
    var dd = $('<div style="flex: 0 0 20px; text-align:center">Enter each <u>publication number</u> or <u>patent number</u> on a separate line below:</div>')
    d.append(dd)

    dd = $('<textarea id="bulk_add_txt" style="flex: 1" placeholder="20010000044\n6923014\n.\n.\n."></textarea>')
    d.append(dd)

    dd = $('<div style="flex: 0 0 20px; text-align:center"></div>')
    var inp = $('<input type="button" value="Submit"></input>')
    inp.click(function(){

	var txt = $('#bulk_add_txt').val()
	txt = txt.split("\n")
	txt.forEach(function(e, i){

	    txt[i] = e.replace(/\D/g,'');
	})

	txt.forEach(function(e, i){
	if(e.length == 11 || e.length == 7 || txt.length == 8){

	    	var exists = false;
	    var a = null
	    for(var i = 0; i < selected_session.assets.length; i++){
		a = selected_session.assets[i];
	    if(a.num == e){
		exists = true
		break;
	    }
	    }
	    if(!exists){
	    selected_session.assets.push({num: e, items:[], comments:[], origin_tab:-1, asset_note:""})
	}

	}
	})
	
	$('#bulk_add_txt').val('')
	refresh_session_assets()
	send_update()
	$('#bulk_add').hide()
    })
    dd.append(inp)
    inp = $('<input type="button" value="Cancel"></input>')
    inp.on('click', function(){

	$('#bulk_add').hide()

    })
    dd.append(inp)
    
    d.append(dd)
    bulk.hide()
    $('body').append(bulk)
    
    $("#load_button").click(function(){
$('#file-input').trigger('click');
    })
    $("#file-input").on("change", function(evt){
        var f = evt.target.files[0]; 
        if (f){
        var r = new FileReader();
        r.onload = function(e){          
            var ans = JSON.parse(e.target.result)
	    
	    for(var i = 0; i < ans.length; i++){
	
		ID_CNT++;
		ans[i].id = ID_CNT
		add_session(ans[i])
	    }
        };
            r.readAsText(f);
        } else 
        {

        }
    });

    
    
    //begin checkboxes
    var rad1 = $('<input id="radio_enable" type="radio" name="enabled">')
    rad1.prop("checked", true);
    var rad2 = $('<input id="radio_disable" type="radio" name="enabled">')
    rad1.click(function(){
	browser.runtime.sendMessage({type: "PAGE_ENABLE_DISABLE_STATUS",  status:true})	

    })
    
    rad2.prop("checked", false);

    rad2.click(function(){
		browser.runtime.sendMessage({type: "PAGE_ENABLE_DISABLE_STATUS",  status:false})

    })
    

    var d2 = $('<span></span>')
    d2.append(rad1)
    d2.append(" :Enabled")
    d2.append(rad2)
    d2.append(" :Disabled")
    $('#check_box_holder').append(d2)
    
    //end checkboxes
    
    var name_ele = $('<span id="user_name" style="margin-left:5px; font-weight:bold;text-decoration:underline">'+username+'</span>')
    var clik = $('<button style="margin-left:5px; height:20px; font-size:10px" value="Change Username">Change Username</button>')

    var func = function(){
	var e = $('<input type="text" value="'+username+'"></input>')
	var clik2 = $('<button style="margin-left:5px; height:20px; font-size:10px" value="Change Name">Accept</button>')
	name_ele.replaceWith(e)
	clik.replaceWith(clik2)
	clik2.on('click', function(){
	    var old_name = username
	    username = e.val()

	    //change name in all comments

	    if(old_name != username){

		session_list.forEach(function(s){
		    s.assets.forEach(function(a){
			a.comments.forEach(function(c){
			    c.entries.forEach(function(e){
				if(e.username == old_name)
				    e.username = username
			    
			  })  
			})
		    })
		})
	    }

	    //change in session creators
	    session_list.forEach(function(e){

		if(e.created_by == old_name)
		    e.created_by = username
		$('#session_ele_cb_'+e.id).html(e.created_by)
	    })
	    

	    //update assets
	    refresh_session_assets()
	    
	    //update record
	    send_update()
	    name_ele.html(username)
	    e.replaceWith(name_ele)
	    clik2.replaceWith(clik)
	    clik.on('click', func)
	})
	
    }
    
    clik.on('click', func)
    $('#username_frame').append(name_ele)
    $('#username_frame').append(clik)
    

    var d = $('<span style="flex:0 0 40px; text-align:left"> All </span>')
    var inp = $('<input type="checkbox"></input>')

	inp.click(function(ip){
	    return function(){
		 $('input.item_check').prop("checked", ip.is(':checked'))  
		
	    }
	}(inp))

    
    d.prepend(inp)
    $('#session_controls').append(d)
    d = $('<span style="flex:1; text-align:right">With Selected: </span>')
    inp = $('<select style="font-size:10px"></select>');
    inp.append('<option>Export</option>')
   // inp.append('<option>Merge</option>')
    inp.append('<option>Delete</option>')
    d.append(inp)
    inp.on('change', function(i){ return function(){

	
    }}(inp))

    var ch = inp
    inp = $('<input type="button" style="font-size:10px; width:40px" value="GO"></input>')
    d.append(inp)

    inp.on('click', function(i){ return function(){
	
	if(ch.val() == "Delete"){

	    $('.item_check:checkbox:checked').toArray().forEach(function(e){
		var id = parseInt($(e).attr('id').split("_")[2])
		for(var i = 0; i < session_list.length; i++){
		    if(session_list[i].id == id){
			session_list.splice(i, 1);
			$("#session_ele_"+id).remove()
		    }
		}

	    })

	    
	    
	}else if(ch.val() == "Export"){
	    var ans = []
	
	     $('.item_check:checkbox:checked').toArray().forEach(function(e){
		var id = parseInt($(e).attr('id').split("_")[2])
		for(var i = 0; i < session_list.length; i++){
		    if(session_list[i].id == id){
			ans.push(session_list[i])
		    }
		}
	     })
	
	
		 var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ans));
		 var dlAnchorElem = document.getElementById('downloadAnchorElem');
		 dlAnchorElem.setAttribute("href",     dataStr     );
		 dlAnchorElem.setAttribute("download", "export.json");
		 dlAnchorElem.click();
								
	}
	else if(ch.val() == "Merge"){
	    

	}
	
	send_update()
    }}(ch))


    
    $('#session_controls').append(d)
    
    $(window).resize()
    browser.runtime.sendMessage({type: "READY_CONTROLS"}).then(async function(r){

	if(r.response == null)
	    r.response = []
	load_data(r.response)


    username = r.username
    $("#user_name").html(username)


	$( "#radio_enable" ).prop( "checked", r.status );
	$( "#radio_disable" ).prop( "checked", !r.status );

	
	
    });
    
//}
    
    
})


$(window).resize(function(){
    $("#ele_file_list").height($("#con_file_load").height()-60)
    $("#ele_sess_list").height($("#con_file_load").height()-40)
    $("#ele_commenters_list").height($("#con_file_load").height()-40)
  //  $("#bulk_add").height($(window).height() - 20)
   // $("#bulk_add").height($(window).width() - 20)
})


function load_data(list){
    
    session_list = list;
    
    for(var i = 0; i < list.length; i++){
	session_list.id = ID_CNT
	ID_CNT++
	var d = create_session_ele(session_list[i])
	$('#ele_file_list').append(d)
    }
    d = $('<input type="button" style="margin-top:5px;" value="NEW"></input>')
    d.click(function(){add_session()})
    

        if(list.length == 0)
	add_session()

    

    //ALWAYS HAVE ONE SESSION SELECTED
    select_item(0)
    
    	$('#ele_file_list').prepend(d)
send_update()

}

function create_session_ele(info){

    ans = $('<div id="session_ele_'+info.id+'" class="session_item"></div>')
    var d = $('<span style="flex:0 0 20px; border-right:1px solid black; box-sizing:border-box; "></span>')
    var inp = $('<input type="checkbox" id="item_check_'+info.id+'" class="item_check" style="position: relative; top: 50%;  transform: translateY(-50%);"></input>')
    d.append(inp)
    ans.append(d)

    d = $('<span id="sess_ele_pan_'+info.id+'" style="flex:1;  box-sizing:border-box; padding:5px"></span>')

    var d1 = new Date(info.creation_date)
    d1 = (d1.getMonth()+1) + "/" + d1.getDate() + "/" + d1.getFullYear() + " " + d1.getHours() + ":" + d1.getMinutes() + ":" + d1.getSeconds()
    
    d.append($('<div><u>Name</u>: <span class="item_name">'+info.title+'</span></div>'))
    d.append($('<div><u>Created By</u>: <span id="session_ele_cb_'+info.id+'">'+info.created_by+'</span></div>'))
    d.append($('<div><u>Creation Date</u>: '+d1+'</div>'))

    d1 = new Date(info.last_updated)
    d1 = (d1.getMonth()+1) + "/" + d1.getDate() + "/" + d1.getFullYear() + " " + d1.getHours() + ":" + d1.getMinutes() + ":" + d1.getSeconds()
    
    d.append($('<div><u>Last Update</u>: <span id="session_ele_lu_'+info.id+'">'+d1+'</span></div>'))
    d.append($('<div><u>#Assets</u>: <span  id="session_ele_cnt_'+info.id+'">'+info.assets.length+'</span></div>'))
    d.click(function(){

	select_item(info.id)
    })
    ans.append(d)

    d = $('<span style="flex:0 0 20px; background-color:#333; color:white; cursor:pointer; box-sizing:border-box; text-align:center"></span>')
    var inp = $('<span style="position: relative; top: 50%;  transform: translateY(-50%);">X</span>')
    d.append(inp)
    ans.append(d)

    d.click(function(){
	if(session_list.length == 1){
	alert('Unable to remove - You must have at least one session.')
	    return;
	}

	for(var i = 0; i < session_list.length; i++){

	    if(session_list[i].id == info.id){
		session_list.splice(i, 1);
		$("#session_ele_"+info.id).remove()
	    }
	}
	if(selected_session != null && 	selected_session.id == info.id)
	    select_item(session_list[0].id)
	
	    send_update()
		      })
    
    //info.ele = ans;  // removing prevents cloning
return ans
}

function select_item(id){

    for(var i = 0; i < session_list.length; i++){

	var s = session_list[i];


	$('#sess_ele_pan_' + s.id).css("background-color", "transparent")
	if(s.id == id){
	    selected_session = s;
	    old_selected_session_txt = JSON.stringify(s)
	    $('#sess_ele_pan_' + s.id).css("background-color", "#9cf")


	    $('#session_name_frame').html('')
    var name_ele = $('<span style="margin-left:5px; font-weight:bold;text-decoration:underline">'+s.title+'</span>')
    var clik = $('<button style="margin-left:5px; height:20px; font-size:10px" value="Change Name">Change Session Name</button>')

    var func = function(){
	var e = $('<input type="text" value="'+s.title+'"></input>')
	var clik2 = $('<button style="margin-left:5px; height:20px; font-size:10px" value="Change Name">Accept</button>')
	name_ele.replaceWith(e)
	clik.replaceWith(clik2)
	clik2.on('click', function(){
	    selected_session.title = e.val()
	    $('#sess_ele_pan_' + selected_session.id).find('span.item_name').html(e.val())
	    name_ele.html(e.val())
	    e.replaceWith(name_ele)
	    send_update()
	    clik2.replaceWith(clik)
	    clik.on('click', func)
	})
	
    }
    
    clik.on('click', func)
    $('#session_name_frame').append(name_ele)
    $('#session_name_frame').append(clik)
    
	    

	}
    }
    refresh_session_assets()
    
}

function refresh_session_assets(){

    if (selected_session == null)
	return

var s = '	      <div class="table_cell" style="flex:0 0 100px">Num/URL</div>'
	  +'    <div class="table_cell" style="flex:0 0 100px">TYPE</div>'
	+'   <div class="table_cell" style="flex:1">Words (Commenters)</div>'
	+'   <div class="table_cell" style="flex:1">Commenters</div>'
    	   +'   <div class="table_cell" style="flex:0 0 40px; margin-right:20px">Remove</div>'

    $("#table_header").html(s)
    
    $("#ele_sess_list").html('')

    for(var i = 0; i < selected_session.assets.length; i++){
    	    //load_assets
	var ass = selected_session.assets[i]
	var type = (ass.num.length > 8 ? "PUBLICATION" : "PATENT")
	var words = ""
	var num = ass.num
	var url = 'http://appft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HITOFF&d=PG01&p=1&u=%2Fnetahtml%2FPTO%2Fsrchnum.html&r=1&f=G&l=50&s1=%22'+num+'%22.PGNR.&OS=DN/'+num+'&RS=DN/'+num

	if(type == "PATENT")
	    url = 'http://patft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HITOFF&d=PALL&p=1&u=%2Fnetahtml%2FPTO%2Fsrchnum.htm&r=1&f=G&l=50&s1='+num+'.PN.&OS=PN/'+num+'&RS=PN/'+num
	
	
	var style = "background-color:#eee"
	if(i % 2 ==0)
	    style = ""
	
	var r = $('<div class="table_row" style="'+style+'"></div>')
	r.append($('<div class="table_cell" style="flex:0 0 100px"><a href="'+url+'" target="_blank">'+num+'</a></div>'))
	r.append($('<div class="table_cell" style="flex:0 0 100px">'+type+'</div>'))

	for(var j = 0; j < ass.items.length; j++){
	  
	    var comms = ": ("
	    var id = ass.items[j].id
	    var list = []
	    for(var k = 0; k < ass.comments.length; k++){
		var tid = ass.comments[k].targ_id.split("_")
		tid.shift()
		
		if(id == parseInt(tid[0])){
	
		    //comms = comms + "Instance #" + (parseInt(tid[1]) + 1)
		    for(var l = 0; l < ass.comments[k].entries.length; l++){
			if(!list.includes(ass.comments[k].entries[l].username)){

			    list.push(ass.comments[k].entries[l].username)
			}
		    }
		}
	    }
	    comms = comms + list.join("; ")
	 
	    comms += ")"
	    comms.length < 5 ? comms = "" :


	    words = words + '"<u>' + ass.items[j].txt + '</u>"' + comms+" <br>"
	}
	
	r.append($('<div class="table_cell" style="flex:1;">'+words+'</div>'))
	
	var d = $('<div class="table_cell" style="flex:1"></div>')
	d.append('<div>Comments and Notes</div>')
	var ta = $('<textarea style="font-size:10px; width:100%">'+ass.asset_note+'</textarea>')

	ta.on('keyup', function(t, a){ return function(){
	    a.asset_note = t.val()
	}}(ta, ass))

	ta.on('change', function(t, a){ return function(){
	     a.asset_note = t.val()
	    send_update()
	}}(ta, ass))

	
	d.append(ta)
	r.append(d)	
	var rem = $('<div class="table_cell" style="flex:0 0 40px">Remove</div>')
	rem.click(function(anum){ return function(){
	    for(var j = 0; j < selected_session.assets.length; j++)
		{
		    if(selected_session.assets[j].num == anum){
			selected_session.assets.splice(j, 1)
			browser.runtime.sendMessage({type: "KILL_TAB", num:anum})
			
			break;
		    }

		}
	    refresh_session_assets()
	    send_update()
	}}(num))
	r.append(rem)
		      
	

	    $("#ele_sess_list").append(r)
    }


    var d = $('<input type="button" style="flex:1" value="Add New"></input>')
    var s= $('<div class="table_row"></div>')
    s.append(d)
    d.click(function(){
		window.open('http://patft.uspto.gov/','_blank');
	//	window.open('http://appft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HITOFF&d=PG01&p=1&u=%2Fnetahtml%2FPTO%2Fsrchnum.html&r=1&f=G&l=50&s1=%2220010000044%22.PGNR.&OS=DN/20010000044&RS=DN/20010000044','_blank');
    })

    $("#ele_sess_list").append(s)

    var d = $('<input type="button" style="flex:1" value="Bulk Add"></input>')
    d.click(function(){
	$('#bulk_add').show()
    })
    var s= $('<div class="table_row"></div>')
    s.append(d)
    d.click(function(){
	
	//	window.open('http://appft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HITOFF&d=PG01&p=1&u=%2Fnetahtml%2FPTO%2Fsrchnum.html&r=1&f=G&l=50&s1=%2220010000044%22.PGNR.&OS=DN/20010000044&RS=DN/20010000044','_blank');
    })

    $("#ele_sess_list").append(s)

    
    
}

function add_session(start_data){
    var dat = new Date()
    var data = {id:ID_CNT,
		title:"None",
		created_by: username,
		creation_date: dat.getTime(),
		last_updated: dat.getTime(),
		assets: []}

    if(typeof start_data !== "undefined"){
	
		data = start_data
    }
    ID_CNT++
    var d = create_session_ele(data)
    $('#ele_file_list').append(d)

    session_list.push(data)
    if(session_list.length == 1)
	selected_session = session_list[0]

    send_update()
}

function send_update(){

    if(selected_session != null){
	if(old_selected_session_txt != JSON.stringify(selected_session)){
	    var d1 = new Date()
	    selected_session.last_updated = d1.getTime()
	    old_selected_session_txt = JSON.stringify(selected_session)
	    d1 = (d1.getMonth()+1) + "/" + d1.getDate() + "/" + d1.getFullYear() + " " + d1.getHours() + ":" + d1.getMinutes() + ":" + d1.getSeconds()
	    $("#session_ele_lu_"+selected_session.id).html(d1)
	}
    }
    

    browser.runtime.sendMessage({type: "CONTROLS_UPDATE", selected_session_id:selected_session.id,  session_list:session_list, username:username})
    
}
