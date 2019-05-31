
var txt_input, item_list, box_ele = null;
var items = []
var ID_CNT = 0;
var claim_txt = ""
var claim_txt_index = ""
var spec_txt = ""
var orig_txt = ""
var sel_details = null
var content = null
var c_menu = null
var sel_span = null
var comments_tab, comments_select, comments_content = null
var comments_canvas, ctx, ctx_timeout = null
var mouse_e = null
var this_pages_num = null
var tab_id = create_id()
var update_central_cntr = 0
var update_central_MAX = 50
var MASTER_ENABLED = false
var last_update = ""

var vis_config = {show_abstract:true,
		  show_claim:true,
		  show_spec:true,
		  comments_only:false,
		  hidden_IDs:[],
		  hidden_commenters:[]
		 }

var comment_list = []

var username = "Default"
var saved_data = []  //files, {page, [items, comments]}



browser.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

    
    if(msg.type == "PAGE_ENABLE_DISABLE_STATUS"){
	
	$( "#radio_enable" ).prop( "checked", msg.status );
	$( "#radio_disable" ).prop( "checked", !msg.status );
	enable_system(msg.status)
    }

})

var left_click = function (sp){
    sel_span = $(sp)
    c_menu.html('')
    var d = $('<div class="menu_butt">Add Comment</div>')
    c_menu.append(d)
    d.click(function(sel_span2){ return function(){
	c_menu.hide()
	add_comment(username, sel_span2, "")
    }}(sel_span))
    
    c_menu.show()
    c_menu.css({
        top: mouse_e.pageY + "px",
        left: mouse_e.pageX + "px"
    });
}





$(document).ready(function () {


    
    ////MANAGMENET
    var manager_ele = $('<div style="display:flex; overflow:hidden; font-size:10px; line-height:20px;flex-direction:row; flex: 0 0 20px; padding:0px; background-color:#ddd; width:100%; box-sizing:border-box; height:20px; z-index:10"></div>')


    var rad1 = $('<input id="radio_enable" type="radio" name="enabled">')
    rad1.prop("checked", false);
    var rad2 = $('<input id="radio_disable" type="radio" name="enabled">')
    rad1.click(function(){
	browser.runtime.sendMessage({type: "PAGE_ENABLE_DISABLE_STATUS",  status:true})	
	enable_system(true)
    })
    
    rad2.prop("checked", true);

    rad2.click(function(){
	browser.runtime.sendMessage({type: "PAGE_ENABLE_DISABLE_STATUS",  status:false})	
	enable_system(false)

    })
    
    
    var d2 = $('<div style="flex:1; text-align:center; font-size:10px"></div>')
    d2.append(rad1)
    d2.append(" :Enabled")
    d2.append(rad2)
    d2.append(" :Disabled")
    manager_ele.append(d2)

    manager_ele.append('<span style="margin-right:20px">Logged in as: <b><span id="user_name">'+username+ '</span></b></span>')
    
    d2 = $('<input type="button" value="Show Control Tab"></input>')
    d2.click(function(){
	browser.runtime.sendMessage({type: "SHOW_CONTROL_TAB"})	
    })
    manager_ele.append(d2)
    
    /// END MANAGEMENT
    
    
    //CHECK IF THIS IS A PROPER PAGE
    var txt = $("body").html()
    txt = txt.replace(/(?:\r\n|\r|\n|\t)/g, ' ');
    txt = txt.replace(/[ ]{2,}/g, ' ');
    
    var m = txt.match(/United States Patent.{15,1000}?>([,\d ]{4,}?)<\//im)

    if(JSON.stringify(m) === "null"){

	return;
    }else{
	m[1] =  m[1].replace(/ /g, "")
	m[1] =  m[1].replace(/,/g, "")
	this_pages_num = m[1]

	//CLOSE OTHER WINDWOS
//	browser.runtime.sendMessage({type: "NEW_PAGE_BROADCAST",  num:this_pages_num, tab_id:tab_id})	
    }



    

    //PREPARE SPACE
    var txt = $("body").html()
    
    //END PREPARE SPACE

    txt = txt.replace(/(?:\r\n|\r|\n|\t)/g, ' ');
    txt = txt.replace(/[ ]{2,}/g, ' ');

    orig_txt = txt;
    $("body").html('')
    $("body").css("display", "flex")
    $("body").css("flex-direction", "column")
    $("body").css("height", "100%")
    $("html").css("height", "100%")
    $("body").css("margin", "0")
    $("body").css("padding", "0")
    $("body").css("box-sizing", "border-box")
    var r = />Claims<.*?<hr>.*?<hr>/gi
    var c = r.exec(txt);
    claim_txt = c[0]
    claim_txt_index = c.index
    spec_txt = txt.slice(0, c.index) + txt.slice(c.index+c[0].length,); 
    
    //Downloads

    $('body').append($('<a id="down_load" style="display:none"></a>'))
    //Downloads
    

    //COMMENTS

    comments_tab = $('<div style="flex:0 0 250px; min-height:0px; font-size:9px"></div>')
    comments_select= $('<div id="comments_select" style="display:block; width:100%; height:75px; background-color:#ddd; display:flex; flex-direction:column"></div>')
    comments_content = $('<div id="comments_content" style="display:block; box-sizing:border-box; padding-left:5px; overflow:auto; min-height:0px"></div>')
    comments_tab.append(comments_select)
    comments_tab.append(comments_content)

    var sel_head = $('<div style="flex:1; background-color:#aaa; text-align:left; font-size:10px; box-sizing:border-box;">: Select All Commenters</div>')
    comments_select.append(sel_head)
    var inp = $('<input type="checkbox" checked></input>')
    sel_head.prepend(inp)
      inp.click(function(ip){
	    return function(){

		$('.commenter_name_checkbox').prop( "checked", ip.is(':checked'));

		vis_config.hidden_commenters = []
		if(!ip.is(':checked'))
		{
		    var arr = $('.commenter_name').toArray()
		    arr.forEach(function(e){
			vis_config.hidden_commenters.push($(e).html())
		    })
		}
		
		update_visibility()
		
	    }
      }(inp))

    var sel_body = $('<div id="comm_sel_body" style="border:1px solid black; height:55px; width:100%; padding:2px;  overflow-y:auto; text-align:left; font-size:10px; box-sizing:border-box;flex-wrap:wrap; display:flex"></div>')
    comments_select.append(sel_body)


   
    
    //END COMMENTS

    ///CREATE BOX ELE
    
    box_ele = $('<div style="flex:0 0 350px; border:0px solid black; background-color:#ddd; display:flex; box-sizing:border-box; flex-direction:column; overflow:hidden; background-color:orange; height:100%"></div>')
    var d = $('<div style="display:flex; flex:1; flex-direction:column; box-sizing:border-box; padding:0px; margin:0px"></div>')


    
    var dd = $('<div style="flex:1; display:flex; flex-direction:row; overflow:hidden; height:100%; box-sizing:border-box"></div>')
    $("body").append(d)
    d.append(manager_ele)
    d.append(dd)
    dd.append(comments_tab)
    var orig = $('<div id="original_content" style="flex:1; display:block; height:100%; overflow:auto; padding:5px; box-sizing:border-box">'+txt+'</div>')
    dd.append(orig)
    comments_canvas = $('<canvas id="img_canvas" style="pointer-events: none; position:fixed; left:0px; top:0px;"; z-index:5></canvas>');
    comments_canvas.width(orig.width())
    comments_canvas.height(orig.height())

    dd.append(comments_canvas)

    ctx = $("#img_canvas")[0].getContext("2d");
    ctx.fillStyle = "blue";
    ctx.strokeStyle = "blue";

    
    
    ctx_timeout = setTimeout(render_comments, 20)



    
    dd.append(box_ele);
    var header = $('<div style="display:flex; flex:0 0 20px; flex-direction:row; font-size:10px; line-height: 20px; background-color:#aaa; height:20px; box-sizing:border-box"></div>')

    var left = $('<span style="flex:1; text-align:left"></span>')
    var right = $('<span style="flex:1; text-align:right"></span>')

    header.append(left)
    header.append(right)
    
    var inp = $('<input type="checkbox" checked></input>')

        inp.click(function(ip){
	    return function(){

	    if(ip.is(':checked')){
		$(".id_checkbox").prop( "checked", true );
		vis_config.hidden_IDs = []
	
	    }
	    else{
		
		$(".id_checkbox").prop( "checked", false);
			vis_config.hidden_IDs = []
			for(var i = 0; i < items.length; i++)
		    vis_config.hidden_IDs.push(items[i].id)

	    }
	    update_visibility()
	}
    }(inp))

    
    var sp = $('<span style="float:left"> All</span>')
    sp.prepend(inp)
    left.prepend(sp)

    inp = $('<input type="checkbox" ></input>')
    sp = $('<span style="float:left">Commented Only</span>')
    sp.prepend(inp)
    //left.append(sp)

    inp = $('<input type="checkbox" checked></input>')
    sp = $('<span style="float:right"> Abstract</span>')
    sp.prepend(inp)
    right.prepend(sp)
    inp.click(function(ip){
	return function(){
	    vis_config.show_abstract = ip.is(':checked')
	    update_visibility()
	}
    }(inp))


    inp = $('<input type="checkbox" checked></input>')
    sp = $('<span style="float:right"> Spec</span>')
    sp.prepend(inp)
    right.prepend(sp)

    inp.click(function(ip){
	return function(){
	    vis_config.show_spec = ip.is(':checked')
	    update_visibility()
	}
    }(inp))


    inp = $('<input type="checkbox" checked></input>')
    sp = $('<span style="float:right"> Claims</span>')
    sp.prepend(inp)
    right.prepend(sp)
    inp.click(function(ip){
	return function(){
	    vis_config.show_claim = ip.is(':checked')
	    update_visibility()
	}
    }(inp))
    
    
    var content_height = 300;


    
    content = $('<div style="display:flex; flex:1; flex-direction:column; background-color:yellow; height:100%; box-sizing:border-box"></div>')

    var search_box = $('<div style="display:flex; flex:0 0 20px; background-color:yellow; flex-direction:row; height:20px; box-sizing:border-box; padding:0px"></div>')
    
    txt_input = $('<input type="text" style="flex:1; font-size:9px"></input>')
    search_box.append(txt_input)
    var inp = $('<input id="add_button" type="button" style="flex:0 0 40px" value="Add"></input>')
    search_box.append(inp)
    inp.click(function(){
	add_item(txt_input.val().trim())
    })
    

    
    
    var dd = $('<div style="display:flex; flex:1; flex-direction:row; background-color:pink; height:100%; overflow:hidden; min-height: min-content; box-sizing:border-box "></div>')

    item_list = $('<div style="display:block; flex:1; font-size:9px;  background-color:#eee; box-sizing:border-box; padding:5px;  overflow:auto;"></div>')
    sel_details = $('<div style="display:block; flex:1; font-size:9px; background-color:#ddd;  box-sizing:border-box; padding:5px; overflow:auto"></div>')

    dd.append(item_list)
    dd.append(sel_details)
    content.append(search_box)
    content.append(header)
    content.append(dd)


    box_ele.append(content)


    /////END BOX ELE


    ///CREATE CONTEXT

    c_menu = $('<div class="c_menu" style="position:absolute;  top:0px; left:0px; z-index:10; border:1px solid black; background-color:red"></div>')
    

    $("body").append(c_menu)
    c_menu.hide()


    ///END CONTEXT


    $("body").keyup(function(event) {
	if ( event.which == 13 || (event.shiftKey && event.which == 32)) {
	    event.preventDefault();
	    $("#add_button").click()
	}

    });

    //LOAD FROM CONTROLS

    browser.runtime.sendMessage({type: "READY_PAGE", origin_tab: tab_id, num:this_pages_num}).then(async function(r){
	if(r.response == null)
	    r.response = []
	load_data(r.response)
	$( "#radio_enable" ).prop( "checked", r.MASTER_ENABLE_STATUS );
	$( "#radio_disable" ).prop( "checked", !r.MASTER_ENABLE_STATUS );
	enable_system(r.MASTER_ENABLE_STATUS)
	
    });
    
    //END LOAD FROM CONTROLS



    //BEGIN BINDINGS


    $(document).bind("mousedown", function (e) {
	
	// If the clicked element is not the menu
	if (!$(e.target).parents(".c_menu").length > 0) {
            
            c_menu.hide()
	}
	mouse_e = e
    });

    $(document).contextmenu(function (e) {
	
	if(!MASTER_ENABLED)
	    return
	    
	var sel = window.getSelection().toString()
	
	if(e.target && $(e.target).attr('id') != undefined && $(e.target).attr('id').includes("mark_")){
	    if(e != null)
		e.preventDefault();


	    
	    c_menu.html('')
	    var d = $('<div class="menu_butt">Add Comment</div>')
	    c_menu.append(d)
	    d.click(function(sel_span2){ return function(){
		c_menu.hide()
		add_comment(username, sel_span2, "")
	    }}($(e.target)))
	    
	    c_menu.show()
	    c_menu.css({
		top: e.pageY + "px",
		left: e.pageX + "px"
	    });
	    
	}
	else if(sel.length > 2){
	    
	    e.preventDefault();
	    // In the right position (the mouse)
	    c_menu.html('')
	    var d = $('<div class="menu_butt">Add Item</div>')
	    c_menu.append(d)
	    d.click(function(){
		c_menu.hide()
		$("#add_button").click()
	    })
	    c_menu.show()
	    c_menu.css({
		top: e.pageY + "px",
		left: e.pageX + "px"
	    });
	}

	sel_span = null;
    });


    //END BINDINGS
    

    $(window).resize()
    $("#original_content").on("mouseup", sel_txt)
   


    
});


function load_data(data){
     
    //CLEAR EVERYTHING

   
    username = data.username
    $("#user_name").html(username)
    items = []
    commment_list = []
    comments_content.html('')
    sel_details.html('')
    item_list.html('');
    ID_CNT = 0;
    var a = $( "span[id^='mark_']").toArray()
    for (var i = 0; i < a.length; i++){
	$(a[i]).replaceWith($(a[i]).html())
    }
    
    var ites = data.items
    var comms = data.comments

    //items
    for(var i = 0; i < ites.length; i++){

	add_item(ites[i].txt, ites[i].id)
    }
    
    //comments

    for(var i = 0; i < comms.length; i++){
	var c = comms[i]

	for(var j = 0; j < c.entries.length; j++){
	    add_comment(c.entries[j].username, $("#"+c.targ_id), c.entries[j].txt)
	}
    }

    //UPDATE ID_CNT TO BE ABOVE MAX
    var arr = []
    items.forEach(function(e) {

	ID_CNT = Math.max(e.id, ID_CNT)
    });
    ID_CNT++
}

function add_item(x, tid){

    if(typeof tid == "undefined"){
	tid = ID_CNT
    }
    ID_CNT++
    //	    tid = 'mark_'+ID_CNT+'_'+i;


    var col = "hsl("+(items.length * 80 % 360)+", 80%, 50%)";
    var hue = (items.length * 80 % 360)
    var claim_cnt = 0;
    var re = new RegExp(x,"gi");
    while((res = re.exec(claim_txt)) !== null) {
	claim_cnt++;
    }

    var spec_cnt = 0;
    while((res = re.exec(spec_txt)) !== null) {
	spec_cnt++;
    }
    var d = $('<div class="item"></div>') 
    var txt = $('<div style="flex:.9; text-align:center;padding:5px; box-sizing:border-box;  word-wrap: break-word;"><div style=" text-decoration:underline; font-size:12px">"'+x+'"</div>Claims Cnt: <b><u>'+claim_cnt+'</b></u> / Spec Cnt: <b><u>'+spec_cnt+'</b></u><br>Total Cnt: <b><u>'+(claim_cnt + spec_cnt)+'</b></u></div>')
    txt.click(function(it){ return function(){
	sel_item(it)
    }}(tid))

    var check = $('<div class="color_tab" style="flex:.1; text-align:center;"></div>');
    
    var inp = $('<input class="id_checkbox" type="checkbox" style="position: relative; top: 50%;  transform: translateY(-50%);" checked></input>')

    inp.click(function(ip, loc, thed){
	return function(){
	    if(!ip.is(':checked'))
		vis_config.hidden_IDs.push(loc)
	    else{
		vis_config.hidden_IDs.splice(vis_config.hidden_IDs.indexOf(loc), 1)
		if(thed.hasClass('item_sel'))
		    sel_item(tid)
	    }
	    update_visibility()
	}
    }(inp, tid, d))

    
    check.append(inp)
   
    d.append(check)
    d.append(txt)
    var color = $('<div class="color_tab" style="flex:.1; background-color:'+col+'; color:white; cursor:pointer; text-align:center;"></div>');
    d.append(color)
    var rem = $('<div class="remove_butt" style="flex:.1; background-color:black; color:white; cursor:pointer;text-align:center;"><div style="position: relative; top: 50%;  transform: translateY(-50%);">X</div></div>');
    rem.click(function(id){return function(){remove_item(id)}}(tid))
    d.append(rem)
    item_list.append(d)
    var the_ele = d;
    //  }

    //add text higlight
    var txt = $("#original_content").html()

    txt = txt.replace(/(?:\r\n|\r|\n|\t)/g, ' ');
    txt = txt.replace(/[ ]{2,}/g, ' ');
    var y = x.split("")
    y = y.join("(?:<span.*?>|<\/span)*?")
    var re = new RegExp(y,"gi");
    re.lastIndex = 0;
    var inst = []
    cnt = 0;
    while((res = re.exec(txt)) !== null) {
	inst.push(res)
	cnt++;
    }

    cum = 0
    for(var i = 0; i < inst.length; i++){
	var e = inst[i]
	var type = "spec"
	if(e.index >= claim_txt_index && e.index < claim_txt_index+claim_txt.length)
	    type = "claim"
	else if( e.index < claim_txt_index+claim_txt.length)
	    type = "abstract"
	
	rep = '<span id="mark_'+tid+'_'+i+'" class="mtype_'+type+'" style="border:0px solid black; padding:0px; background-color:hsla('+hue+',100%, 50%, .4); position:relative; cursor:pointer">'+e[0]+'</span>'
	txt = txt.slice(0, e.index+cum) + rep + txt.slice(e.index+cum + e[0].length,);
	diff = rep.length - e[0].length
	cum += diff
    }
    
    
    $("#original_content").html(txt)
    //silly extension scope
    
    items.push({id:tid, 'txt':x, 'col': col, 'hue': hue, 'ele': the_ele, 'cnt': cnt});
    // sel_item(tid)
    
    
}

function remove_item(id){

    var comm_obj = null;
    for(var i = 0; i < comment_list.length; i++){

	//targId is of speciifc span, id to thsi argument is teh ID_CNT
	
	if(comment_list[i].targ_id.includes("mark_"+id+"_")){
	    
	    comm_obj = comment_list[i]
	    comment_list.splice(i, 1)
	    comm_obj.ele.remove()
	    break;
	}
	var ele_from = comment_list[i].ele;
    }
    
    for(var i = 0; i < items.length; i++){

	if(items[i]['id'] == id){
	    var ite = items[i];
	    items.splice(i,1);

	    if(ite.ele.hasClass("item_sel"))
		sel_details.html('')
	    ite.ele.remove()
	    for(var j = 0; j < ite["cnt"]; j++){
		var h = $("#mark_"+id+"_"+j).html()
		$("#mark_"+id+"_"+j).replaceWith(h)
		$("#mnum_"+id+"_"+j).remove()
		//remove comments
		
	    }
	    //reset colors
	    for(var k = 0; k < items.length; k++){
		var col = "hsl("+ (k * 80 % 360) +", 80%, 50%";
		items[k]["col"] = col
		items[k]["the_ele"].children("div.color_tab").css("background-color", col);
		for(var l = 0; l < items[k]['cnt']; l++){
		    $("#mark_"+items[l]['id']+"_"+l).css("background-color", col)	
		}
	    }

	    return;
	}

    }

    
}

function find_hits(ite){

    ans = []
    var claim_cnt = 0;
    var re = new RegExp(ite["txt"],"gi");
    while((res = re.exec(orig_txt)) !== null) {
	var ex = orig_txt.slice(Math.max(0, res.index - 50),Math.min(orig_txt.length, res.index + 50));

	ex = ex.replace(/(?:<.*?>|^.*?>|<.*$)/gi, " ")
	
	ex = ex.replace(ite["txt"], '<span style="font-size:11px;  font-variant: small-caps; text-decoration:underline;font-weight:bold;color:hsl('+ite["hue"]+',100%, 20%)">'+ ite["txt"] +"<\/span>");
	
	
	if(res.index >= claim_txt_index && res.index < claim_txt_index+claim_txt.length)
	    ans.push({type:"Claim", excerpt:ex, curr_loc:-1})
	else if( res.index < claim_txt_index+claim_txt.length)
	    ans.push({type:"Abstract", excerpt:ex, curr_loc:-1})
	else 
	    ans.push({type:"Spec", excerpt:ex, curr_loc:-1})
    }

    var txt = $("#original_content").html()
    txt = txt.replace(/(?:\r\n|\r|\n|\t)/g, ' ');
    txt = txt.replace(/[ ]{2,}/g, ' ');

    for(var i = 0; i < ite["cnt"]; i++){
	ans[i]["curr_loc"] = $('#mark_'+ite['id']+"_"+i).offset().top + $("#original_content").scrollTop()

    }

    return ans

}

function sel_item(id, num){


    sel_details.html('')
    var click_targ = null
    for(var i = 0; i < items.length; i++){
	items[i].ele.removeClass('item')
	items[i].ele.removeClass('item_sel')
	if(items[i]['id'] == id){
	    items[i].ele.addClass('item_sel')
	    var ans = find_hits(items[i])
	    for(var j = 0; j < ans.length; j++){
		var d = $('<div class="detail_ele detail har_id_'+id+' ite_type_'+ans[j]["type"].toLowerCase()+'" style="display:flex; flex-direction:row"></div>')
		var ccol="black"
		var bgcol = "#efefef"
		if(ans[j]["type"] == "Abstract"){
		    bgcol = "#888"
		    ccol = "white"
		}
		else if(ans[j]["type"] == "Claim")
		    bgcol = "#aaa"
		
		d.append($('<div style="flex:0 0 50px; min-height:80px; padding:5px; text-align:center; position:relative; background-color:'+bgcol+'"><div style="position:absolute;top:5px;left:0px;width:50px; text-align:center; font-variant:small-caps; color:'+ccol+'">'+ans[j]["type"]+'</div><div style="position: relative; top: 50%;  transform: translateY(-50%); border:1px solid black; border-radius: 2em; height:3em; width:3em; line-height:3em; background-color:hsl('+items[i]['hue']+', 100%, 80%); display:block; margin:0 auto; font-weight:bold">'+(j + 1)+'</div></div>'))

		d.append($('<div style="padding:5px">. . . '+ans[j]["excerpt"]+' . . . </div>'))
		d.click(function(pos, ite, num){return function(){

		    var arr = sel_details.children(".detail");
		    for(var i = 0; i < arr.length; i++){
			$(arr[i]).removeClass('detail_ele')
			$(arr[i]).removeClass('detail_ele_sel')
			if(i == num){
			    $(arr[i]).addClass('detail_ele_sel')
			}else{
			    $(arr[i]).addClass('detail_ele')
			}

		    }

		    
		    $('#original_content').animate({
			scrollTop: pos - $(window).height() / 2 
		    },500, function(){
			
			$( "span[id^='mark_"+ite['id']+"_']").css("background-color", "hsla("+ite['hue']+", 100%, 50%, 0.4)");
			$( "#mark_"+ite['id']+"_"+num).css("background-color", "hsla("+ite["hue"]+", 100%, 50%, .9)")

		    });

		}}(ans[j]["curr_loc"], items[i], j))
		sel_details.append(d)


		if(typeof num != "undefined" && num == j){
		    click_targ = d
		}
		
	    }
	}else{
	    items[i].ele.addClass('item')
	}

    }
    if(click_targ != null){
	click_targ.trigger("click")
	sel_details.animate({
	    scrollTop: click_targ.position().top - sel_details.height() / 2 
	},500)


	
    }
   update_visibility()
}

function sel_txt(e){

    var sel = window.getSelection().toString()
    
    if(sel.length > 2){
	txt_input.val(sel)
	content.show()
    }

}

function count (txt, re) {
    return (txt.match(re) || []).length
}

$(window).resize(function(){
    $("#original_content").height($(window).height()-30)

    comments_canvas.width($("#original_content").width())
    comments_canvas.height($("#original_content").height())

    comments_content.height($("#original_content").height() - comments_select.height() + 10)


    document.getElementById('img_canvas').width = $("#original_content").width();
    document.getElementById('img_canvas').height = $("#original_content").height();
    
    //	ctx = $("#img_canvas")[0].getContext("2d");

    var o = $("#original_content").position()
    
    comments_canvas.css({top: o.top, left: o.left})
    item_list.height($(window).height()-70) //70 and not 60 because of margin bottoms in list
    sel_details.height($(window).height()- 70)



    
})



function render_comments(){

    ctx.clearRect(0, 0, comments_canvas.width(), comments_canvas.height());
    if(!MASTER_ENABLED){
	ctx_timeout = setTimeout(render_comments, 20)
	return
    }
    
    update_central_cntr = (update_central_cntr + 1) % update_central_MAX
    if(update_central_cntr == 0)
	msg_send_update()
    update_saved()
    
    


    for(var i = 0; i < comment_list.length; i++){
	
	var targ = $("#"+comment_list[i].targ_id);
	var ele_from = comment_list[i].ele;
	var col = targ.css("background-color").split(",")
//	col[3] = " 1)"
	col = col.join(',')
	ctx.strokeStyle = col;
	ctx.lineWidth = 3
	var o = targ.css("background-color").split(",")[3]
	o = parseFloat(o.slice(o, o.length - 1))
	if(o == 0)
	    continue;

	if(targ.position().top + targ.height() < 0 || targ.position().top > $("#original_content").height())
	    continue;
	
	//ctx.strokeRect(c.dim.x, c.dim.y, c.dim.w, c.dim.h);
	ctx.beginPath();
	ctx.moveTo(0,ele_from.position().top - 15 + ele_from.height() / 2 );
	
	var t = targ.position()
	
	ctx.lineTo(t.left - comments_tab.width(), t.top - targ.height() / 2);
	//	ctx.lineTo(20, 20);
	//ctx.moveTo(0, 0);
	//ctx.lineTo(comments_canvas.width(), comments_canvas.height());
	ctx.stroke();
	
	
	//	var t = comment_list[i].targ


    }
    

    ctx_timeout = setTimeout(render_comments, 20)
}


function load_json(json){

    saved_data = json.data;
    var num = '2222'
    var m = window.location.href.match(/.N\/(\d*?)&/)
    if(m != null){
	num = m[1]
    }
    
    for(var i = 0; i < saved_data.length; i++){
	if(saved_data[i].num == num){
	    //items
	    
	    var ites = saved_data[i].items;
	    for(var j = 0; j < ites.length; j++){
		var missing = true
		for(var k = 0; k < items.length; k++){
		    if(items[k].txt == ites[j].txt)
		    {missing = false; break}
		}
		if(missing)
		    add_item(ites[j].txt)
	    }
	    
	    //comments
	    var comms = saved_data[i].comment_list;
	    for(var j = 0; j < comms.length; j++){
		var c = comms[j];
		for(var k = 0; k < c.notes.length; k++){
		    add_comment(c.notes[k].u_name, $("#"+comms[j].targ_id), c.notes[k].txt)
		}
		
	    }
	    
	    break;
	}
	
    }

}

function update_saved(){
    
    var num = '2222'
    var m = window.location.href.match(/.N\/(\d*?)&/)
    if(m != null){
	num = m[0]
    }


    var c_list = []
    for(var i = 0; i < comment_list.length; i++){
	c = comment_list[i]
	var nms = comment_list[i].ele.find(".comm_username")

	var txts = comment_list[i].ele.find(".comm_text")
	var n = []
	for(var j = 0; j < nms.length; j++){
	    n.push({u_name:$(nms[j]).html(), txt:$(txts[j]).val()})
	}
	c_list.push({"targ_id":c.targ_id, "notes":n})
    }
    
    for(var i = 0; i < saved_data.length; i++){

	if(saved_data[i].num == num){
	    saved_data[i].comment_list = c_list
	    saved_data[i].items = items
	    return
	}
    }
    //missing
    saved_data.push({num:num, comment_list:c_list, items:items})
   
}

function save(){
    
    
    var json = {time: Math.floor(Date.now() / 1000),
		data: saved_data};
    
    
    
    
    var str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
    
    var d= document.getElementById('down_load');
    d.setAttribute("download", "save_file.json");
    d.setAttribute("href",     str   );
    d.click();
    
}


function add_comment(u_name, ele, txt){

    //Exists in selector?

    var arr = $("span.commenter_name").toArray();
    var exists = false;
    for(var i = 0; i < arr.length; i++){
	if(u_name === $(arr[i]).html()){
	    exists = true;
	    break
	}
    }
    if(!exists){

	var d = $('<div id="commenter_box" style="border:1px solid black; height:25px; line-height:25px;padding:2px; text-align:left; font-size:10px; box-sizing:border-box; flex-grow:0"><span class="commenter_name">'+u_name+'</span> </div>');
	var inp = $('<input type="checkbox" class="commenter_name_checkbox" checked></input>')

	inp.click(function(ip, un){
	    return function(){

		var ind = vis_config.hidden_commenters.indexOf(un)
		if(ip.is(':checked') && ind != -1)
		    vis_config.hidden_commenters.splice(un, 1)
		else if(!ip.is(':checked') && ind == -1)
		    vis_config.hidden_commenters.push(un)
		update_visibility()
		
	    }
	}(inp, u_name))

	
	
	d.prepend(inp)
		
	$('#comm_sel_body').append(d)

	
 
    }

    //general add
    var nums = ele.attr('id').split('_')
    nums.splice(0, 1)
    nums = nums.map(Number);
    var phrase = ""
    var hue = 100
    for(var i = 0; i < items.length; i++){
	if(items[i].id == nums[0]){
	    phrase = items[i].txt
	    hue = items[i].hue
	    break;
	}
    }

    var comm_name = "comm_for_" + ele.attr('id')
    var e = $('<div id="'+comm_name+'" style="display:flex: font-size:9px; flex-direction:column; border:1px solid black; width:100%; margin-top:5px; box-sizing:border-box"></div>')
    
    var header = $('<div style="flex:0 0 20px; margin-bottom:5px; display:flex;  flex-direction:row; background-color:hsl('+hue+',100%, 70%); overflow:hidden"></div>')
    var s = $('<span style="text-align:left; flex:1">"'+phrase+'" instance #'+(nums[1]+1)+'</span>')
    header.append(s)

    var rem = $('<span style="text-align:right; box-sizing:border-box; padding-right:5px; flex:0 0 20px; background-color:#333;color:white; cursor:pointer">X</span>')
    header.append(rem)

    rem.click(function(){
	$('#'+comm_name).remove()

	for(var i = 0; i < comment_list.length; i++){
	    var ite = comment_list[i];
	    if(ite.targ_id == ele.attr("id")){
		comment_list.splice(i, 1)
		break;
	    }
	}
	
    })

    
    header.hover(function() {
	$(this).css("background-color",'hsl('+hue+',100%, 90%)')
	$(this).css("cursor",'pointer')
    }, function() {
	$(this).css("background-color",'hsl('+hue+',100%, 70%)')
	$(this).css("cursor",'normal')
    });

    header.on('click', function(){
	
	sel_item(nums[0], nums[1])
    })
    
    var body = $('<div class="comment_body" style="flex:1; min-height:50px"></div>')
    


    var note_name = u_name + "_" + ele.attr('id')
    var note = $('<div class="note" id="'+note_name+'" style="margin-bottom:5px; border:1px solid black; display:block; box-sizing:border-box; margin-left:5px; margin-right:5px; border-radius:5px; display:flex;flex-direction:column"></div>')

    var note_header = $('<div style="flex: 0 0 10px; font-size:10px; display:flex; flex-direction:row; background-color:#ddd"></div>')
    var tmp = $('<div class="comm_username" style="text-align:left;flex:1">'+u_name+'</div>')
    note_header.append(tmp)

    tmp =  $('<span style="text-align:right; box-sizing:border-box; padding-right:5px; flex:0 0 20px; background-color:#333;color:white;cursor:pointer">X</span>')

    tmp.click(function(){
	$('#'+note_name).remove()

	for(var i = 0; i < comment_list.length; i++){
	    var ite = comment_list[i];
	    if(ite.targ_id == ele.attr("id")){
		for(var j = 0; j < ite.entries.length; j++){
		    if(ite.entries[j].username == u_name){
			ite.entries.splice(j,1)
			if(ite.entries.length == 0){
			    rem.click()
			}
			break;
		    }
		}
		break;
	    }
	}
    })
    
    note_header.append(tmp)
    note.append(note_header)
    
    var d = $('<div></div>')
    var ta_ele = $('<textarea class="comm_text" style="width:100%; font-size:9px">'+txt+'</textarea>')

    ta_ele.bind('input propertychange', function() {
	for(var i = 0; i < comment_list.length; i++){
	    var ite = comment_list[i];
	    if(ite.targ_id == ele.attr("id")){
		for(var j = 0; j < ite.entries.length; j++){
		    if(ite.entries[j].username == u_name){
			ite.entries[j].txt = ta_ele.val()
			break;
		    }
		}
		break;
	    }
	}
    });

    d.append(ta_ele)
    note.append(d)
    
    body.append(note)
    e.append(header)
    e.append(body)

    ele.css("background-color", "3px solid #9cf")
    var missing= true;

    for(var i = 0; i < comment_list.length; i++){
	var ite = comment_list[i];
	if(ite.targ_id == ele.attr("id")){
	    e = ite.ele
	    //check if username already present
	    var missing2 = true;
	    for(var j = 0; j < ite.entries.length; j++){
		if(ite.entries[j].username == u_name){
		    txt = ite.entries[j].textarea_ele.val() + ";\n\n" + txt
		    ite.entries[j].textarea_ele.val(txt)
		    ite.entries[j].txt = txt
		    missing2 = false;
		    break;
		}
	    }
	    if(missing2)
	    {
		ite.ele.children(".comment_body").append(note)
		ite.entries.push({username:u_name, txt: txt, textarea_ele: ta_ele, note_ele:note})
		
	    }
	    missing = false;
	    break;
	}
    }
    
    if(missing){
	comment_list.push({"targ_id":ele.attr("id"),  "ele":e, "entries":[{username:u_name, txt:txt, textarea_ele: ta_ele, note_ele:note}]})

	comment_list.sort(function(a,b){

	    var p1 = $("#"+a.targ_id).offset()
	    var p2 = $("#"+b.targ_id).offset()

	    var ans = (p1.top) - (p2.top)
	    if(ans != 0)
		return ans
	    else
		return (p1.left) - (p2.left)

	})

	//Only mess with the one new one
	for(var i = 0; i < comment_list.length; i++){
	    if(comment_list[i].ele == e){
		if(i == 0){
		    $('#comments_content').prepend(comment_list[i].ele)		
		}else{
		    comment_list[i].ele.insertAfter(comment_list[i-1].ele)		
		}

		break;
	    }
	}
    }
}

//BEGIN: SIMPLIFY VIEW TOOLS

function update_visibility(){
   

    //BEGIN HIDE ITEM IDS

    var hidden_list = []
    for(var i = 0; i < items.length; i++){

	
	var hide = vis_config.hidden_IDs.indexOf(items[i].id) != -1
	//ites
	if(!hide){
//	    if(items[i].ele.hasClass('item_sel'))
//		sel_item(items[i].id)
	}
	else
	    $(".har_id_"+items[i].id).remove()

	 


	
	hide ? hidden_list.push(items[i].id) : ""
	//spans
	var arr = $( "span[id^='mark_"+items[i].id+"_']").toArray()
	for(var j = 0; j < arr.length; j++){
	    var t; 
	    !hide ? t = ".4" : t = "0"
	    var str = $(arr[j]).css("background-color")
	    c = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
	    c.shift()
	    c.map(Number)
	    $(arr[j]).css("background-color", 'rgba('+c[0]+','+c[1]+','+c[2]+','+t+')')
	}


    }

    //END HIDE ITEM IDS


    
    //BEGIN HIDE SEL DETAILS
    var l = ["abstract", "claim", "spec"]
    for(var i = 0; i < 3; i++){
	//ites
	vis_config["show_"+l[i]] ? $(".ite_type_"+l[i]).show() : $(".ite_type_"+l[i]).hide()
	//spans
	var arr = $(".mtype_"+l[i]).toArray()
	for(var j = 0; j < arr.length; j++){
	    var nums = $(arr[j]).attr('id').split('_')
	    nums.splice(0, 1)
	    nums = nums.map(Number);
	    if(	hidden_list.indexOf(nums[0]) != -1)
		continue
	 
	    vis_config["show_"+l[i]] ? t = ".4" : t = "0"
	    var str = $(arr[j]).css("background-color")
	    c = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
	    c.shift()
	    c.map(Number)
	    
	    $(arr[j]).css("background-color", 'rgba('+c[0]+','+c[1]+','+c[2]+','+t+')')
	}
	

    }

    //END HIDE SEL DETAILS



    //BEGIN HIDE COMMENTER NOTES

    //First hide based on IDS

   
    for(var i = 0; i < comment_list.length; i++){
	
	//targId is of speciifc span, id to thsi argument is teh ID_CNT
	
	var a = $("#"+comment_list[i].targ_id).css("background-color").match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3}), ?([\d\.]{1,3})\)?/)
	
	a.shift()
	a.map(Number)
	a = a[3]
	
	var hide = (a == 0)
	hide ? comment_list[i].ele.hide() : comment_list[i].ele.show(); 
    }
    
    //Second hide individual commenters

    for(var i = 0; i < comment_list.length; i++){
//	if(!comment_list[i].ele.is(':visible'))
//	    continue

	for(var j = 0; j < comment_list[i].entries.length; j++){
	    var tae = comment_list[i].entries[j].note_ele
	    var u_name = comment_list[i].entries[j].username
	    vis_config.hidden_commenters.indexOf(u_name) == -1 ? tae.show() : tae.hide();

	}
    }
    
    //END HIDE COMMENTER NOTES

    
}





//END: SIMPLIFY VIEW TOOLS



function create_id() {
    var ans  = '';

    var ch       = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for ( var i = 0; i < 20; i++ ) {
	ans += ch.charAt(Math.floor(Math.random() * ch.length));
    }
    return ans;
}



//BEGIN MESSAGING

//receive update

//send update

function msg_send_update(){
    if(!MASTER_ENABLED)
	return
    var ites = []
    var comms = []

    for(var i = 0; i < items.length; i++){
	ites.push({id: items[i].id, txt: items[i].txt})
    }

    for(var i = 0; i < comment_list.length; i++){
	var ents = []
	for(var j = 0; j < comment_list[i].entries.length; j++){
	    var e = comment_list[i].entries[j]
	    ents.push({username:e.username, txt:e.txt})
	}
	
	comms.push({targ_id: comment_list[i].targ_id, entries:ents})
    }

    var ans = {type: "PAGE_TO_CONTROL_UPDATE",  origin_tab: tab_id, num:this_pages_num, items:ites, comments:comms}
    if(JSON.stringify(ans) != last_update)
        browser.runtime.sendMessage(ans)
last_update = JSON.stringify(ans)
}


//END MESSAGING


function enable_system(state){
    MASTER_ENABLED = state;
    
    if(state){
	if(this_pages_num != null){
	    comments_tab.show()
	    box_ele.show()
	}

    }else{
	comments_tab.hide()
	box_ele.hide()
    }

    var a = $( "span[id^='mark_']").toArray()
    for (var i = 0; i < a.length; i++){
	var t = "0"
	state ? t = ".4" : t = "0"
	var str = $(a[i]).css("background-color")
	c = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
	c.shift()
	c.map(Number)
	$(a[i]).css("background-color", 'rgba('+c[0]+','+c[1]+','+c[2]+','+t+')')
    }


}
