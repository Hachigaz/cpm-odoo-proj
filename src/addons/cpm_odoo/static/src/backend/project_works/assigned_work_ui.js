/** @odoo-module **/
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo} from "../components/component_utils";
import { registry } from "@web/core/registry"
import { session } from "@web/session";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";
import { WorkOverviewPage } from "./work_overview_page";
import { AssignedTaskDetailView } from "./assigned_task_view_ui";

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
            id:WorkOverviewPage.page_name,
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
        },
        {
            id:AssignedTaskDetailView.page_name,
            name:"Task Detail",
            page:AssignedTaskDetailView,
            group_id:"",
            hidden:true
        }
    ]

    setup(){
        if(session.uid !== parseInt(sessionStorage.getItem('user_id'))){
            sessionStorage.clear()
            sessionStorage.setItem('user_id',session.uid)
        }
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
                user_id:session.uid
            })
            this.pageContext = getPageContext()
        }
        this.orm = useService('orm')

        onWillStart(async ()=>{
            await this.loadData()

            this.props.context_data = {
                user_id:this.pageContext.user_id,
                staff_id:this.staff_id
            }

        })
        
        onMounted(()=>{
            let el_btn = document.querySelector(`#main-side-menu #${this.currentPage}`)
            if(el_btn){
                el_btn.classList.toggle("active")
            }
        })
    }

    async loadData(){
        let staff_rec = (await (this.orm.call(
            "cpm_odoo.human_res_staff",
            "search_read",
            [
                [
                    ["user_id",'=',this.pageContext.user_id]
                ],
                ["id"],
                0,1,""
            ]
        )))[0]

        if(staff_rec){
            this.staff_id = staff_rec.id
        }
        else{
            this.staff_id = 1
        }
    }

    async callPage(id) {

        moveToPage(id,null)
    }
}

registry.category("actions").add(AssignedWorkPage.clientActionName, AssignedWorkPage);