/** @odoo-module **/
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

class ProjectPage extends Component{

}

export class ProjectOverviewPage extends Component {
    static template = "cpm_odoo.ProjectOverviewPage";
}


export class ProjectPlanningPage extends Component {
    static template = "cpm_odoo.ProjectPlanningPage";
}


export class ProjectFinancePage extends Component {
    static template = "cpm_odoo.ProjectFinancePage";
}

class ProjectManageUI extends Component {
    static template = "cpm_odoo.ProjectManageUI";

    static components = {
        ProjectOverviewPage,
        ProjectPlanningPage,
        ProjectFinancePage
    };
    
    availablePages = [
        {
            id:"ProjectOverviewPage",
            name:"Overview",
            page:ProjectOverviewPage
        },
        {
            id:"ProjectPlanningPage",
            name:"Planning",
            page:ProjectPlanningPage
        },
        {
            id:"ProjectFinancePage",
            name:"Finance",
            page:ProjectFinancePage
        }
    ]

    setup(){
        if(sessionStorage.getItem('project_id')===null){
            if(this.props.action.context.project_id){
                sessionStorage.setItem('project_id',this.props.action.context.project_id)
            }
            else{
                window.location.href='/web'
            }
        }
        this.project_id = sessionStorage.getItem('project_id')

        if(sessionStorage.getItem('currentPage')){
            this.currentPage = sessionStorage.getItem('currentPage')
        }
        else{
            this.currentPage = this.availablePages[0].id
        }

        super.setup()
    }

    getUsersPrivileges(){

    }

    async callPage(id) {
        sessionStorage.setItem('currentPage',id)
        location.reload()
    }
}

registry.category("actions").add("cpm_odoo.project_manage_ui", ProjectManageUI);