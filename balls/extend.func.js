function recommend(articleid){
	$.post(siteUrl+'index.php?app=article&ac=recommend',{'articleid':articleid},function(rs){
		if(rs==0){

		  var html='';
 		  html += "已有帐号<a href='https://www.51qianduan.com/user/login.html'> >>立即登录</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	      
		  html += "新用户<a href='https://www.51qianduan.com/user/register.html'> >>开始注册</a>";
		  
		  $(".modal-xxxx").addClass("modal-user");
		  
          $(".modal-user").html(html);
		  

            tsNotice('请登陆后再推荐！');

		}else if(rs == 1){

            tsNotice('你已经推荐过了！');

		}else if(rs == 2){

			window.location.reload()
		}
	})
}

function getObject(objectId){
	if(document.getElementById && document.getElementById(objectId)){
		return document.getElementById(objectId);
	}else if(document.all && document.all(objectId)){
		return document.all(objectId);
	}else if(document.layers && document.layers[objectId]){
		return document.layers[objectId];
	}else{
		return false;
	}
}

function showHide(e,objname){
	var obj = getObject(objname);
	if(obj.style.height == "60px"){
		obj.style.height = "100%";
		e.className="plus";
	}else{
		obj.style.height = "60px";
		e.className="minus";
	}
}








$(function() {
	//article下载
	$('.active .downloads').on('click', function() {
		var fav = $(this);
		//alert(fav.data('app'));
		if(siteUserid){
		$.post(siteUrl+'article/ajax/ts/download/',{'articleid':fav.data('id'),'app':fav.data('app')},function(data){
			if(data.ret){
				//tsNotice(data.msg,"下载提示");
				
				//没绑定手机号提示去绑定
				if(data.ret == 'notel'){
					
					$('.overlay').show(); //换个背景关不掉的类
					$('#bindtelbox').fadeIn();//显示框
					//$("#bindtelbox .switch-close").remove(); //直接删掉这个DIV
					var _top=($(window).height()-$(".layerbox").height())/2;
					var _left=($(window).width()-$(".layerbox").width())/2;
					$(".layerbox").css({top:_top,left:_left});
					$("#otherway-bindtel .bindtel-publicTitle2 p").html("请先绑定手机号，在进行下载");
					$("#otherway-bindtel .bindtel-publicTitle2 p").css("left", "29%");
					
				}else{
					
					tsNotice(data.msg,"下载提示");
					
				}
				
				
			}else{
				if(data.alink){
					tsNotice(data.msg,"下载提示");
					window.location.href=data.alink;
				}else{
					tsNotice(data.msg,"下载提示");
				}
			}
		}, 'json');
		}else{
			
			tsLayerbox("请先登录，在下载！");
			
		}
	});
	
	//article收藏
	$('.active .collect').on('click', function() {
		var fav = $(this);
		if(siteUserid){
			$.post(siteUrl+'article/ajax/ts/shoucang/',{'articleid':fav.data('id')} , function(data) {

				if (data.ret == "add") {
					var a = "<span>已收藏</span>";
					var d = "<p>"+data.msg+"</p>";
					fav.removeClass("fav-false");
					fav.addClass("fav-true");
					
					$("#favirite-ret .alert-con i").removeClass("icont-false");
					$("#favirite-ret .alert-con i").addClass("icont-true");
					
					fav.find("span").replaceWith(a);
					$("#favirite-ret .alert-con .icont-true").next().replaceWith(d),
					$("#favirite-ret").fadeIn(200),
					setTimeout(function() {
						$("#favirite-ret").fadeOut(200)
					}, 1500)
	
					return false;
				}
				
				if (data.ret == "del") {
					var a = "<span>收藏</span>";
					var d = "<p>"+data.msg+"</p>";;
					fav.removeClass("fav-true");
					fav.addClass("fav-false");
					
					$("#favirite-ret .alert-con i").removeClass("icont-true");
					$("#favirite-ret .alert-con i").addClass("icont-false");
					
					fav.find("span").replaceWith(a);
					$("#favirite-ret .alert-con .icont-false").next().replaceWith(d),
					$("#favirite-ret").fadeIn(200),
					setTimeout(function() {
						$("#favirite-ret").fadeOut(200)
					}, 1500)	

	
					return false;
				}
				
	
				if (data.ret == "error") {
					var d = "<p>"+data.msg+"</p>";
					
					$("#favirite-ret .alert-con i").removeClass("icont-true");
					$("#favirite-ret .alert-con i").addClass("icont-false");
					
					$("#favirite-ret .alert-con .icont-false").next().replaceWith(d),
					$("#favirite-ret").fadeIn(200),
					setTimeout(function() {
						$("#favirite-ret").fadeOut(200)
					}, 1500)	
					
					return false;
					
				}
				
			}, 'json');		
			
		}else{
			
			tsLayerbox("请先登录，在收藏！");
			
		}
		
	});
	
	
	//article附件重复检测
	$('#buttonFujian,#buttonSubmit').on('click', function() {

		var buttonFujianThis=$(this);
		
		var objFile = document.getElementById("fileFujian");
		//判断edit页面空可以提交
		if(objFile.value == "" && buttonFujianThis.attr("data-ac")=="edit") {
			$("#formApp").submit(); 
			return false;
		}
		//判断其他情况空不能提交
		if(objFile.value == "") {
			alert("请先上传附件！");
			return false;
		}
		//alert($('#fileFujian')[0].files[0]);
		var contents="";
		var formData = new FormData(); 
		formData.append('fujian', $('#fileFujian')[0].files[0]); 
		formData.append('pubid', $("#pubid").val());
		$.ajax({ 
			  url: siteUrl+'article/ajax/ts/fujiancode',
			  type: 'POST',
			  cache: false,
			  data: formData,
			  processData: false,
			  contentType: false,
			  success:function (data) {
				 if(data == '[]'){
					 if(buttonFujianThis.attr("value") == 'release'){
					 	$("#formApp").submit(); 
					 }else{
						alert("可以上传，未检测到重复代码！");
						return false;
					 }
				 }else if(data == 0){
				 	alert("未能获取到html代码，请重新压缩文件ZIP形式在上传！");
					return false;
				 
			  	 }else{
					 alert("附件已重复！");
					 var res = eval("("+data+")");
					  
					 for(var i=0;i<res.length;i++){
						var articleid = res[i].articleid;
						contents=contents+"<li id='fujian_li'><a href='"+siteUrl+"article/"+articleid+".html' target='_blank'>相似内容ID："+articleid+"</a></li>";
					  
					 }
					 $("#fujian_ul").html(contents); 
					 
					 return false;
				 }
				
			  },
			  error: function(XMLHttpRequest, textStatus, errorThrown){
				  alert(JSON.parse(XMLHttpRequest.responseText).msg);
			  }
			
		});

		
	});
	
		
});