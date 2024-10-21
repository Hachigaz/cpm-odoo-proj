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
            });
        }
    }

    class WorkflowListDisplay extends Component{
        static page_name = "WorkflowListDisplay"
        static template = "cpm_odoo.WorkflowListDisplay";

        setup(){
            onWillStart(()=>{
                
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
            moveToPage(false,"manage_workflow")
        }
    }

    class PlanningWorkflows extends Component {
        static template = "cpm_odoo.PlanningWorkflows";
        static components = {WorkflowListDisplay}

        setup(){
            this.page_data = useState({
                workflow_list : [

                ]
            })

            this.actionList = [
                {
                    id:"act_create_workflow",
                    name:"Create New Workflow",
                    action:'/action/get/cpm_odoo.create_new_workflow_action_server',
                    params:{
                        'default_planning_id':this.props.context_data.planning_id,
                        'client_action':this.props.context_data.client_action
                    }
                }
            ]
            // this.page_data = {
            //     workflow_list:[]
            // }
            onWillStart(()=>{
                this.loadPage()
            })

            onMounted(()=>{            
                this.setupGraphs()
            })
        }

        setupGraphs(){
            gantt.config.date_format = "%Y-%m-%d %H:%i";
            gantt.init("workflow-graph");
            gantt.parse({
                data: [
                    {id: 1, text: "Project #1", start_date: null, duration: null, parent:0, progress: 0, open: true},
                    {id: 2, text: "Task #1", start_date: "2019-08-01 00:00", duration:5, parent:1, progress: 1},
                    {id: 3, text: "Task #2", start_date: "2019-08-06 00:00", duration:2, parent:1, progress: 0.5},
                    {id: 4, text: "Task #3", start_date: null, duration: null, parent:1, progress: 0.8, open: true},
                    {id: 5, text: "Task #3.1", start_date: "2019-08-09 00:00", duration:2, parent:4, progress: 0.2},
                    {id: 6, text: "Task #3.2", start_date: "2019-08-11 00:00", duration:1, parent:4, progress: 0}
                ],
                links:[
                    {id:1, source:2, target:3, type:"0"},
                    {id:2, source:3, target:4, type:"0"},
                    {id:3, source:5, target:6, type:"0"}
                ]
            });
        }

        async loadPage(){
            let list_result = await this.props.context_data.orm.call(
                'cpm_odoo.planning_workflow',
                'search_read',
                [
                    [
                        ['planning_id.id','=',this.props.context_data.planning_id]
                    ],
                    ["id","planning_id","name","start_date","exp_end"],
                    0,null,"start_date"
                ]
            )
            
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

            this.actionList = [
                {
                    id:"act_create_task",
                    name:"Create New Task",
                    action:'/action/get/cpm_odoo.create_new_task_action_server',
                    params:{
                        'default_workflow_id':this.pageInfo.workflow_id,
                        'client_action':this.props.context_data.client_action
                    }
                }
            ]


            if(this.pageInfo===undefined){
                alert("no page info")
                moveToPage(false,"workflow")
            }
            onWillStart(()=>{
                this.loadData()
            })
        }
        

        async loadData(){
            this.workflow_info = await this.props.context_data.orm.call(
                'cpm_odoo.planning_workflow',
                'search_read',
                [
                    [
                        ['id','=',this.pageInfo.workflow_id]
                    ],
                    ["id","name","start_date","exp_end"],
                    0,1,null
                ]
            )
        }

        async _do_action(action,params){
            let result = await this.props.context_data.rpc(
                action,
                params
            )

            window.location.href=result
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
                id: "overview",
                name:"Overview",
                page:PlanningOverview,
                group_id:"cpm_view_project_plans"
            },
            {
                id: "workflow",
                name:"Workflows",
                page:PlanningWorkflows,
                group_id:"cpm_manage_project_plans"
            },
            {
                id: "manage_workflow",
                name:"Manage Workflow",
                page:PlanningManageWorkflow,
                group_id:"cpm_manage_project_plans",
                hidden:true
            }
        ]

        setup(){
            this.currentPage = getPageContext().subpage_id;
            if (this.currentPage == null){
                this.currentPage=this.availablePages[0].id
            }
            
        }
    
    
        async callSubPage(id) {
            moveToPage(false,id)
        }
    }

    // Export your component
    return {ProjectPlanningPage};
});