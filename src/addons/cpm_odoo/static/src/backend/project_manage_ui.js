/** @odoo-module **/

odoo.define(
    'cpm_module.project_manage_ui', 
    [
        "@odoo/owl",
        "@web/core/registry",
        "cpm_modules.project_planning_pages",
        "cpm_modules.project_finance_pages",
        "cpm_modules.component_utils"
    ], 
    function (require) {
    'use strict';

    const { Component, onWillStart, onMounted, mount, loadFile} = require("@odoo/owl");
    const { useService } = require("@web/core/utils/hooks")
    const { registry } = require("@web/core/registry")
    const { ProjectPlanningPage} = require("cpm_modules.project_planning_pages");
    const { ProjectOverviewPage, ProjectFinancePage} = require("cpm_modules.project_finance_pages");
    const { storePageContext,getPageContext,moveToPage} = require("cpm_modules.component_utils");
    // const { csrf_token } = require("@web/core")


    const clientAction = "cpm_module.project_manage_ui"

    class ProjectManageUI extends Component {
        static template = "cpm_odoo.ProjectManageUI";
    
        static components = {
            ProjectOverviewPage,
            ProjectPlanningPage,
            ProjectFinancePage
        };

        get pageComponent() {
            const renderPage = this.availablePages.find(page => page.id === this.currentPage);
            return renderPage.page
        }

        availablePages = [
            {
                id:0,
                name:"Overview",
                page:ProjectOverviewPage,
                group_id:"cpm_overview_project"
            },
            {
                id:1,
                name:"Planning",
                page:ProjectPlanningPage,
                group_id:"cpm_view_project_plans"
            },
            {
                id:2,
                name:"Finance",
                page:ProjectFinancePage,
                group_id:"cpm_view_project_finances"
            },
            {
                id:3,
                name:"Staffs",
                page:ProjectFinancePage,
                group_id:"cpm_view_project_staffs"
            }
        ]
    
        setup(){
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
                project_id: sessionStorage.getItem('project_id'),
                planning_id: sessionStorage.getItem('planning_id'),
                finance_id: sessionStorage.getItem('finance_id'),
                doc_id: sessionStorage.getItem('doc_id'),
                client_action: clientAction,
                rpc: useService("rpc"),
                orm: useService("orm")
            }
            if(getPageContext()){
                this.currentPage = getPageContext().page_id;
            }
            else{
                this.currentPage = 0
                storePageContext({
                    page_id:0,
                    subpage_id:0
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
        }
    
        async getUserPrivileges(){
            let result = await this.props.context_data.rpc("/proj/authorize")
            this.props.context_data.csrf_token = result.csrf_token
        }
    
        async callPage(id) {
            moveToPage(id,0)
        }
    }

    registry.category("actions").add(clientAction, ProjectManageUI);

    return ProjectManageUI,clientAction
});