/** @odoo-module **/
import { storePageContext,getPageContext,moveToPage} from "../components/component_utils";
import { ProjectOverviewPage } from "./overview/project_overview_page";
import { ProjectFinancePage } from "./finance/project_finance_pages";
import { Component, onWillStart, onMounted, mount, loadFile} from "@odoo/owl"
import { useService } from "@web/core/utils/hooks"
import { registry } from "@web/core/registry"
import { ProjectPlanningPage} from "./planning/project_planning_pages";
import { DocumentManagementTab } from "../doc_mgmt/document_mgmt";
import { session } from "@web/session";
import { ContractManagementTab } from "../doc_mgmt/contract_mgmt";
import { ProjectManagerUI } from "./managers/manager_uis";
import { RiskIssuesUI } from "./risks_issues/risk_issues_uis";
import { QualityControlUI } from "./qcs/quality_control_uis";
import { StakeholdersUI } from "./stakeholders/stakeholders_ui";

class ProjectManageUI extends Component {
    static template = "cpm_odoo.ProjectManageUI";
    static clientActionName = "cpm_odoo.project_manage_ui"

    static components = {
        ProjectOverviewPage,
        ProjectPlanningPage,
        ProjectFinancePage,
        DocumentManagementTab,
        ContractManagementTab,
        ProjectManagerUI
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
            id: "documents",
            name:"Documents",
            page:DocumentManagementTab,
            group_id:"cpm_manage_project_plans"
        },
        {
            id: "contracts",
            name:"Contracts",
            page:ContractManagementTab,
            group_id:"cpm_manage_project_plans"
        },
        {
            id: "risks_and_issues",
            name:"Risks and Issues",
            page:RiskIssuesUI,
            group_id:"cpm_manage_project_plans"
        },
        {
            id: "quality_controls",
            name:"Qualty Controls",
            page:QualityControlUI,
            group_id:"cpm_manage_project_plans"
        },
        {
            id: "proj_managers",
            name:"Managers",
            page:ProjectManagerUI,
            group_id:"cpm_manage_project_plans"
        },
        {
            id: "stakeholders",
            name:"Stakeholders",
            page:StakeholdersUI,
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
        
        onWillStart(async () => {
            await this.getUserPrivileges()
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
        let project_rec = await this.props.context_data.orm.call(
            "cpm_odoo.root_project",
            "get_user_mgmt_groups",
            [
                this.props.context_data.project_id,
                session.uid
            ]
        )

        this.availablePages[1].hidden = !project_rec.planning_group_id
        this.availablePages[2].hidden = !project_rec.finance_group_id
        this.availablePages[3].hidden = !project_rec.document_group_id
        this.availablePages[4].hidden = !project_rec.contract_group_id
        this.availablePages[5].hidden = !project_rec.risk_issue_group_id
        this.availablePages[6].hidden = !project_rec.qa_group_id
        this.availablePages[7].hidden = !project_rec.head_mgmt_group_id
    }

    async callPage(id) {
        moveToPage(id,null)
    }
}

registry.category("actions").add(ProjectManageUI.clientActionName, ProjectManageUI);