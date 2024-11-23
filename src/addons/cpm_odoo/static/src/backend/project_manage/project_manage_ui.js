/** @odoo-module **/
import { storePageContext,getPageContext,moveToPage} from "../components/component_utils";
import { ProjectOverviewPage } from "./overview/project_overview_page";
import { ProjectFinancePage } from "./finance/project_finance_pages";
import { Component, onWillStart, onMounted, mount, loadFile} from "@odoo/owl"
import { useService } from "@web/core/utils/hooks"
import { registry } from "@web/core/registry"
import { ProjectPlanningPage} from "./planning/project_planning_pages";
import { PlanningDocumentManagementTab } from "../doc_mgmt/document_mgmt";
import { session } from "@web/session";

class ProjectManageUI extends Component {
    static template = "cpm_odoo.ProjectManageUI";
    static clientActionName = "cpm_odoo.project_manage_ui"

    static components = {
        ProjectOverviewPage,
        ProjectPlanningPage,
        ProjectFinancePage,
        PlanningDocumentManagementTab
    };

    get pageComponent() {
        const renderPage = this.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    availablePages = [
        {
            id:"overview",
            name:"Overview",
            page:ProjectOverviewPage,
            group_id:"cpm_overview_project"
        },
        {
            id:"planning",
            name:"Planning",
            page:ProjectPlanningPage,
            group_id:"cpm_view_project_plans"
        },
        {
            id:"finance",
            name:"Finance",
            page:ProjectFinancePage,
            group_id:"cpm_view_project_finances"
        },
        {
            id:"safety_and_risks",
            name:"Safety and Risks",
            page:ProjectFinancePage,
            group_id:"cpm_view_project_staffs"
        },
        {
            id: "documents",
            name:"Documents",
            page:PlanningDocumentManagementTab,
            group_id:"cpm_manage_project_plans"
        }
    ]

    setup(){
        if(session.uid !== parseInt(sessionStorage.getItem('user_id'))){
            sessionStorage.clear()
            sessionStorage.setItem('user_id',session.uid)
        }
        if(sessionStorage.getItem('project_id')===null || this.props.action.context.project_id){
            if(this.props.action.context.project_id !== sessionStorage.getItem("project_id")){
                sessionStorage.setItem('project_id',this.props.action.context.project_id)
                sessionStorage.setItem('planning_id',this.props.action.context.proj_planning_id)
                sessionStorage.setItem('finance_id',this.props.action.context.proj_finance_id)
                sessionStorage.setItem('doc_id',this.props.action.context.proj_doc_id)
            }
            else{
                window.location.href='/web'
            }
        }
        this.props.context_data={
            project_id: parseInt(sessionStorage.getItem('project_id')),
            planning_id: parseInt(sessionStorage.getItem('planning_id')),
            finance_id: parseInt(sessionStorage.getItem('finance_id')),
            doc_id: parseInt(sessionStorage.getItem('doc_id')),
            user_id: parseInt(sessionStorage.getItem('user_id')),
            client_action: this.clientActionName,
            rpc: useService("rpc"),
            orm: useService("orm"),
            action: useService("action")
        }
        if(getPageContext().client_action === this.constructor.clientActionName){
            this.currentPage = getPageContext().page_id;
        }
        else{
            this.currentPage = this.availablePages[0].id
            storePageContext({
                page_id: this.currentPage,
                subpage_id:null,
                client_action : this.constructor.clientActionName
            })
        }
        
        onWillStart(() => {
            this.getUserPrivileges()
        });

        // onMounted(async() => {
        //     let pageElement = document.querySelector('#page-content');
            
        //     const renderPage = this.availablePages.find(page => page.id === this.currentPage);

        //     // const templates = await loadFile(renderPage.page.templatePath);

        //     const env = {
        //     //  templates,
        //         props:{
        //             context_data:this.props.context_data
        //         }
        //     };
            

        //     mount(renderPage.page,pageElement,env)
        //     this.currentPage = this.availablePages.find(page => page.id === this.currentPage)
        // })
        onMounted(()=>{
            document.querySelector(`.main-header #${this.currentPage}`).classList.toggle("active")
        })
    }

    async getUserPrivileges(){
        let result = await this.props.context_data.rpc("/proj/authorize")
        this.props.context_data.csrf_token = result.csrf_token
    }

    async callPage(id) {
        moveToPage(id,null)
    }
}

registry.category("actions").add(ProjectManageUI.clientActionName, ProjectManageUI);