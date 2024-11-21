/** @odoo-module **/
import { ItemList, SearchBar} from "../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo} from "../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";


export class AssignedTaskDetailView extends Component{
    static page_name="assigned_task_detail_view"
    static template="cpm_odoo.AssignedTaskDetailView"

    setup(){
        const pageInfo = getPageInfo("assigned_task_detail_view")
        if(!pageInfo){
            alert("No page info")
            moveToPage("work_overview_page")
        }

        onWillDestroy(()=>{
            clearPageInfo(this.constructor.page_name)
        })
    }
}