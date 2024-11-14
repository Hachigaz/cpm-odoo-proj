/** @odoo-module **/
import { GanttDisplay, ItemList, SearchBar} from "../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime} from "../components/component_utils";
import { registry } from "@web/core/registry"
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";
import { WorkOverviewPage } from "./work_overview_page";

class AssignedWorkPage extends Component{
    static clientActionName = "cpm_odoo.assigned_work_ui"
    static template="cpm_odoo.AssignedWorkPage"


    static components = {
        WorkOverviewPage
    };

    get pageComponent() {
        const renderPage = this.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    availablePages = [
        {
            id:"overview",
            name:"Overview",
            page:WorkOverviewPage,
            group_id:""
        },
        {
            id:"current_work",
            name:"Current Work",
            page:WorkOverviewPage,
            group_id:""
        },
        {
            id:"upcoming_work",
            name:"Upcoming Work",
            page:WorkOverviewPage,
            group_id:""
        }
    ]

    setup(){
        if(getPageContext().client_action === this.constructor.clientActionName){
            this.currentPage = getPageContext().page_id;
            this.pageContext = getPageContext()
        }
        else{
            this.currentPage = this.availablePages[0].id
            storePageContext({
                page_id: this.currentPage,
                subpage_id:null,
                client_action : this.constructor.clientActionName,
                user_id:1,
                staff_id:1
            })
            this.pageContext = getPageContext()
        }


        this.props.context_data = {
            user_id:this.pageContext.user_id,
            staff_id:this.pageContext.staff_id
        }
        
        onMounted(()=>{
            document.querySelector(`#main-side-menu #${this.currentPage}`).classList.toggle("active")
        })
    }

    async callPage(id) {
        moveToPage(id,null)
    }
}

registry.category("actions").add(AssignedWorkPage.clientActionName, AssignedWorkPage);

class AssignedTaskView extends Component{
    static clientActionName = "cpm_odoo.assigned_task_view"
    static template="cpm_odoo.AssignedWorkPage"
}

registry.category("actions").add(AssignedTaskView.clientActionName, AssignedTaskView);