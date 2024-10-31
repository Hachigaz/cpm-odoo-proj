/** @odoo-module **/
import { GanttDisplay } from "./components";

odoo.define(
    'cpm_modules.project_planning_pages', 
    [
        "@odoo/owl",
        "@web/core/utils/hooks",
        "cpm_modules.component_utils"
    ], 
    function (require) {
    'use strict';

    const { Component, onWillStart, onMounted, onWillPatch, useEffect, onWillUpdateProps, mount, loadFile, useState, useRef} = require("@odoo/owl");
    const { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate} = require("cpm_modules.component_utils");
    
    class PlanningOverview extends Component {
        static page_name = "PlanningOverview"
        static template = "cpm_odoo.PlanningOverview";
        setup(){
            onMounted(() => {

            });
        }
    }

    class PlanningWorkflowList extends Component{
        static template = "cpm_odoo.PlanningWorkflowList";

        formatDate = formatDate

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

    class PlanningWorkflowGraph extends GanttDisplay{
        setup(){
            super.setup()
        }

        setup_graph(){
            gantt.config.columns = [
                {name: "text", label: "Task Name", width: "*"},
                {name: "start_date", label: "Start Date", align: "center", width: 100},
                { name: "_end_date", label: "Exp. End Date", align: "center", width: 100 }
            ];
        }

        update_graph_data(){
            for(const workflow of this.props.state_data.workflow_list){

                let duration = 21
                let text = workflow.name
                let options = "none"
                let _end_date = workflow.exp_end
                if(_end_date !== false){
                    duration = (new Date(_end_date) - new Date(workflow.start_date))/(24 * 60 * 60 * 1000)
                }
                else{
                    _end_date = "TBD"
                    // text+=""
                }

                this.graph_data.data.push({
                    id:workflow.id,
                    text: text,
                    start_date: workflow.start_date,
                    duration:duration,
                    _end_date:_end_date,
                    status:workflow.workflow_status,
                    options:options
                })
                
                if(workflow.depends_on){
                    for(const deps of workflow.depends_on){
                        this.graph_data.links.push({
                            id:this.graph_data.links.length, 
                            source:deps, 
                            target:workflow.id, 
                            type:"0"
                        })
                    }
                }
            }
        }
    }

    class PlanningWorkflows extends Component {
        static template = "cpm_odoo.PlanningWorkflows";
        static components = {PlanningWorkflowList,PlanningWorkflowGraph}

        setup(){
            this.page_data = useState({
                workflow_list : [

                ]
            })

            this.other_data = useState({
                graph_display_data : [

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
            
            onWillStart(()=>{
                this.loadPage()
            })

            onMounted(()=>{
                
            })
        }

        async loadPage(){
            let list_result = await this.props.context_data.orm.call(
                'cpm_odoo.planning_workflow',
                'search_read',
                [
                    [
                        ['planning_id.id','=',this.props.context_data.planning_id]
                    ],
                    ["id","planning_id","name","start_date","exp_end","end_date","depends_on","workflow_status"],
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

    //=============================================================
    // Manage Workflow Component
    //=============================================================
    

    class PlanningTaskList extends Component {
        static template = "cpm_odoo.PlanningTaskList";

        formatDate = formatDate

        setup(){
        }

        act_manage_task(task_id){
            storePageInfo(
                PlanningManageTask.page_name,
                {
                    task_id:task_id
                }
            )
            moveToPage(false,"manage_task")
        }

        act_search()
    }

    
    class PlanningTaskGraph extends GanttDisplay{
        setup(){
            super.setup()
        }

        setup_graph(){
            gantt.config.columns = [
                {name: "text", label: "Task Name", width: "*"},
                {name: "start_date", label: "Start Date", align: "center", width: 100},
                { name: "_end_date", label: "Exp. End Date", align: "center", width: 100 }
            ];
        }

        update_graph_data(){
            for(const task of this.props.state_data.task_list){

                let duration = 21
                let text = task.name
                let options = "none"
                let _end_date = task.exp_end
                if(_end_date !== false){
                    duration = (new Date(_end_date) - new Date(task.start_date))/(24 * 60 * 60 * 1000)
                }
                else{
                    _end_date = "TBD"
                    // text+=""
                }

                this.graph_data.data.push({
                    id:task.id,
                    text: text,
                    start_date: task.start_date,
                    duration:duration,
                    _end_date:_end_date,
                    status:task.task_status,
                    options:options
                })
                
                if(task.depends_on){
                    for(const deps of task.depends_on){
                        this.graph_data.links.push({
                            id:this.graph_data.links.length, 
                            source:deps, 
                            target:task.id, 
                            type:"0"
                        })
                    }
                }
            }
        }
    }

    class PlanningManageWorkflow extends Component{
        static page_name = "PlanningManageWorkflow"
        static template = "cpm_odoo.PlanningManageWorkflow";
        static components = {PlanningTaskList,PlanningTaskGraph}

        setup(){
            const page_name = PlanningManageWorkflow.page_name
            this.pageInfo = getPageInfo(page_name)
            
            if(this.pageInfo===undefined){
                alert("no page info")
                moveToPage(false,"workflow")
            }

            this.page_data = useState({
                workflow_info:{

                },
                task_list:[]
            })
            
            this.loadData()

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


            onWillStart(()=>{

            })
        }
        

        async loadData(){
            this.page_data.workflow_info = (await this.props.context_data.orm.call(
                'cpm_odoo.planning_workflow',
                'search_read',
                [
                    [
                        ['id','=',this.pageInfo.workflow_id]
                    ],
                    ["id","name","start_date","exp_end","workflow_status","task_count","unassigned_task_count"],
                    0,1,null
                ]
            ))[0]
            if(!this.page_data.workflow_info){
                moveToPage(false,"workflow")
            }

            this.page_data.task_list = await this.props.context_data.orm.call(
                'cpm_odoo.planning_task',
                'search_read',
                [
                    [
                        ['workflow_id','=',this.pageInfo.workflow_id]
                    ],
                    ["id","name","description","start_date","exp_end"],
                    0,null,null
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



    //=============================================================
    // Manage Task Component
    //=============================================================
    class PlanningManageTask extends Component{
        static page_name = "PlanningManageTask"
        static template = "cpm_odoo.PlanningManageTask";
        // static components = {PlanningTaskList,PlanningTaskGraph}

        formatDate = formatDate

        setup(){
            const page_name = PlanningManageTask.page_name
            this.pageInfo = getPageInfo(page_name)
            
            if(this.pageInfo===undefined){
                alert("no page info")
                moveToPage(false,"workflow")
            }

            this.page_data = useState({
                task_info:{

                }
            })
            
            this.loadData()

            this.actionList = [
                {
                    id:"act_edit_task_general_info",
                    name:"Edit General Info",
                    action:'/action/get/cpm_odoo.edit_task_general_info_action_server',
                    params:{
                        'default_workflow_id':this.pageInfo.task_id,
                        'client_action':this.props.context_data.client_action
                    }
                }
            ]


            onWillStart(()=>{

            })
        }
        

        async loadData(){
            this.page_data.task_info = (await this.props.context_data.orm.call(
                'cpm_odoo.planning_task',
                'search_read',
                [
                    [
                        ['id','=',this.pageInfo.task_id]
                    ],
                    ["id","name","start_date","exp_end","task_status"],
                    0,1,null
                ]
            ))[0]
            if(!this.page_data.task_info){
                moveToPage(false,"workflow")
            }
        }

        async _do_action(action,params){
            let result = await this.props.context_data.rpc(
                action,
                params
            )

            window.location.href=result
        }
    }

    



    //=============================================================
    // Root Component
    //=============================================================    
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
            },
            {
                id: "manage_task",
                name:"Manage Task",
                page:PlanningManageTask,
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