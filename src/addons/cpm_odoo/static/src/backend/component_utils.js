/** @odoo-module **/

odoo.define(
    'cpm_modules.component_utils', 
    [], 
    function (require) {
    'use strict';


    function storePageContext(context){
        sessionStorage.setItem("pageContext",JSON.stringify(context))
    }
    
    function getPageContext(){
        if(sessionStorage.getItem("pageContext")){
            return JSON.parse(sessionStorage.getItem("pageContext"))
        }
        else{
            return false
        }
    }
    
    function moveToPage(page_id,subpage_id){
        let pageContext = getPageContext()
    
        if(page_id!==false){
            pageContext.page_id = page_id
        }
        if(subpage_id!==false){
            pageContext.subpage_id = subpage_id
        }
    
        storePageContext(pageContext)
        location.reload()
    }


    function storePageInfo(page_name,data){
        data.page_name = page_name
        sessionStorage.setItem("pageExtraData",JSON.stringify(data))
    }
    
    function getPageInfo(page_name){
        if(sessionStorage.getItem("pageExtraData")){
            let data = JSON.parse(sessionStorage.getItem("pageExtraData"))
            if(data.page_name===page_name){
                return data
            }
            else{
                return undefined
            }
        }
        else{
            return undefined
        }
    }

    return {storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo}
});