/** @odoo-module **/
odoo.define(
    'cpm_modules.project_planning_pages', 
    [
        "@odoo/owl",
        "@web/core/utils/hooks",
        "cpm_modules.component_utils"
    ], 
    function (require) {
    'use strict';

    const { Component, onWillStart, onMounted, mount, loadFile, useState, reactive} = require("@odoo/owl");
    const { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo} = require("cpm_modules.component_utils");


    class PlanningOverview extends Component {
        static page_name = "PlanningOverview"
        static template = "cpm_odoo.PlanningOverview";
        setup(){
            onMounted(() => {
                // this.getOverviewView()
            });
        }
    
        getOverviewView(){
            fetch('/proj/planning/overview_view', {
                method: 'GET'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text(); // or response.text(), etc.
            })
            .then(data => {
                document.querySelector("#planning-overview-info").innerHTML = data
            })
            .catch(error => {
              console.error('There has been a problem with your fetch operation:', error);
            });
        }
    }

    class WorkflowListDisplay extends Component{
        static page_name = "WorkflowListDisplay"
        static template = "cpm_odoo.WorkflowListDisplay";

        setup(){
            onWillStart(()=>{
                console.log(this.props.page_data)
            })
        }

        act_edit_general_info(workflow_id){
            let action = '/action/get/cpm_odoo.edit_general_info'
            let params = {
                'default_planning_id':this.props.context_data.planning_id,
                'client_action':this.props.context_data.client_action
            }
        }

        act_manage_workflow(workflow_id){
            storePageInfo(
                PlanningManageWorkflow.page_name,
                {
                    workflow_id:workflow_id
                }
            )
            moveToPage(false,4)
        }
    }

    class PlanningWorkflows extends Component {
        static template = "cpm_odoo.PlanningWorkflows";
        static components = {WorkflowListDisplay}
            
        actionList = [
            {
                id:"act_add_workflow",
                name:"Add New Workflow",
                action:'/action/get/cpm_odoo.create_new_workflow_action_server',
                params:{
                    'default_planning_id':this.props.context_data.planning_id,
                    'client_action':this.props.context_data.client_action
                }
            },
            {
                id:"manage_workflows",
                name:"Manage Workflows",
                action:'/action/get/cpm_odoo.create_new_workflow_action_server',
                params:{
                    'default_planning_id':this.props.context_data.planning_id,
                    'client_action':this.props.context_data.client_action
                }
            }
        ]

        setup(){
            this.page_data = useState({
                workflow_list : [

                ]
            })
            // this.page_data = {
            //     workflow_list:[]
            // }
            onWillStart(()=>{
                this.loadPage()
            })
        }

        async loadPage(){
            let list_result = await this.props.context_data.orm.call('cpm_odoo.planning_workflow','search_read',[[]])
            // list_result.forEach(element => {
            //     this.page_data.workflow_list.push(element)
            // });
            this.page_data.workflow_list = list_result
        }

        async _do_action(action,params){
            let result = await this.props.context_data.rpc(
                action,
                params
            )

            window.location.href=result
        }
    }

    class PlanningDrafts extends Component {
        static page_name = "PlanningDrafts"
        static template = "cpm_odoo.PlanningDrafts";
        setup(){
        }
    }

    class PlanningUnassignedTasks extends Component {
        static page_name = "PlanningUnassignedTasks"
        static template = "cpm_odoo.PlanningUnassignedTasks";
        setup(){
        }
    }

    class PlanningManageWorkflow extends Component{
        static page_name = "PlanningManageWorkflow"
        static template = "cpm_odoo.PlanningManageWorkflow";
        setup(){
            const page_name = PlanningManageWorkflow.page_name
            this.pageInfo = getPageInfo(page_name)
            if(this.pageInfo===undefined){
                alert("no page info")
                moveToPage(false,1)
            }
            onWillStart(()=>{
                this.loadData()
            })
        }
        

        async loadData(){
            let workflow_info = await this.props.context_data.orm.call(
                'cpm_odoo.planning_workflow',
                'search_read',
                [['id','=',this.pageInfo.workflow_id]]
            )
            console.log(workflow_info)
        }
    }

    class ProjectPlanningPage extends Component {
        static page_name = "ProjectPlanningPage"
        static template = "cpm_odoo.ProjectPlanningPage";
        static components = {PlanningOverview,PlanningWorkflows,PlanningDrafts,PlanningUnassignedTasks}
        
        get subpageComponent() {
            const renderPage = this.availablePages.find(page => page.id === this.currentPage);
            return renderPage.page
        }

        availablePages = [
            {
                id: 0,
                name:"Overview",
                page:PlanningOverview,
                group_id:"cpm_view_project_plans"
            },
            {
                id: 1,
                name:"Workflows",
                page:PlanningWorkflows,
                group_id:"cpm_manage_project_plans"
            },
            {
                id: 2,
                name:"Drafts",
                page:PlanningDrafts,
                group_id:"cpm_manage_project_plans"
            },
            {
                id: 3,
                name:"Unassgined Tasks",
                page:PlanningUnassignedTasks,
                group_id:"cpm_manage_project_plans"
            },
            {
                id: 4,
                name:"Manage Workflow",
                page:PlanningManageWorkflow,
                group_id:"cpm_manage_project_plans",
                hidden:true
            }
        ]

        setup(){
            this.currentPage = getPageContext().subpage_id;
            
        }
    
    
        async callSubPage(id) {
            moveToPage(false,id)
        }
    }

    // Export your component
    return {ProjectPlanningPage};
});