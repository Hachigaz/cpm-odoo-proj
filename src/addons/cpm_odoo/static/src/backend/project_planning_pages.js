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

    const { Component, onWillStart, onMounted, onWillPatch, useEffect, onWillUpdateProps, mount, loadFile, useState, reactive} = require("@odoo/owl");
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

    class WorkflowGraphDisplay extends Component{
        static template = "cpm_odoo.WorkflowGraphDisplay";
        
        setup(){
            this.temp_data = {
                display_size:{
                    width:"100%",
                    height:"60vh"
                }
            }

            let display_size = this.props.other_data.display_size
            if(display_size!==undefined){
                if(display_size.width!==undefined){
                    this.temp_data.display_size.width = display_size.width   
                }
                if(display_size.height!==undefined){
                    this.temp_data.display_size.height = display_size.height
                }
            }
        
            onWillStart(()=>{
                
            })

            onMounted(()=>{
                this.setupGraphs()
            })

            useEffect(()=>{
                this.updateGraphData()
            })
        }

        setupGraphs(){
            gantt.config.date_format = "%Y-%m-%d";
            gantt.init("workflow-graph");

            gantt.config.scales = [
                {
                    format : "%m/%y",
                    unit : "month",
                    step: 1
                },
                {
                    unit: "week", 
                    step: 2, 
                    date: "Week %W"
                }
            ]

            gantt.config.layout = {
                css: "gantt_container",
                rows:[
                    {
                       cols: [
                        {
                          // the default grid view  
                          view: "grid",  
                          scrollX:"scrollHor", 
                          scrollY:"scrollVer"
                        },
                        { resizer: true, width: 1 },
                        {
                          // the default timeline view
                          view: "timeline", 
                          scrollX:"scrollHor", 
                          scrollY:"scrollVer"
                        },
                        {
                          view: "scrollbar", 
                          id:"scrollVer"
                        }
                    ]},
                    {
                        view: "scrollbar", 
                        id:"scrollHor"
                    }
                ]
            }

            gantt.config.min_column_width = 100;

            gantt.config.drag_move = false;     
            gantt.config.drag_resize = false;   
            gantt.config.drag_progress = false;
            gantt.config.drag_links = false;
            
            gantt.config.columns = [
                {name: "text", label: "Task Name", width: "*"},
                {name: "start_date", label: "Start Date", align: "center", width: 100},
                { name: "_end_date", label: "Exp. End Date", align: "center", width: 100 }
            ];
        }

        updateGraphData(){
            let graph_data = []
            let graph_links = []
            console.log(this.props.page_data.workflow_list)
            for(const workflow of this.props.page_data.workflow_list){

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

                graph_data.push({
                    id:workflow.id,
                    text: text,
                    start_date: workflow.start_date,
                    duration:duration,
                    _end_date:_end_date,
                    status:workflow.workflow_status,
                    options:options
                })
                
                for(const deps of workflow.depends_on){
                    graph_links.push({
                        id:graph_links.length, 
                        source:deps, 
                        target:workflow.id, 
                        type:"0"
                    })
                }
            }


            gantt.clearAll();
            gantt.parse({
                data: graph_data,
                links:graph_links
            });
        }
    }

    class PlanningWorkflows extends Component {
        static template = "cpm_odoo.PlanningWorkflows";
        static components = {WorkflowListDisplay,WorkflowGraphDisplay}

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
    

    class PlanningWorkflowTaskList extends Component {
        static template = "cpm_odoo.PlanningWorkflowTaskList";
        setup(){
        }
    }
    

    class PlanningWorkflowTaskSchedule extends Component {
        static template = "cpm_odoo.PlanningWorkflowTaskSchedule";
        setup(){
        }
    }


    class PlanningManageWorkflow extends Component{
        static page_name = "PlanningManageWorkflow"
        static template = "cpm_odoo.PlanningManageWorkflow";
        static components = [
            PlanningWorkflowTaskList,PlanningWorkflowTaskSchedule
        ]

        setup(){
            const page_name = PlanningManageWorkflow.page_name
            this.pageInfo = getPageInfo(page_name)

            this.page_data = useState({
                workflow_info:{

                },
                task_list:{

                }
            })

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
            this.page_data.workflow_info = await this.props.context_data.orm.call(
                'cpm_odoo.planning_workflow',
                'search_read',
                [
                    [
                        ['id','=',this.pageInfo.workflow_id]
                    ],
                    ["id","name","start_date","exp_end","workflow_status","task_count","unassigned_task_count"],
                    0,1,null
                ]
            )
            this.page_data.task_list = await this.props.context_data.orm.call(
                'cpm_odoo.planning_task',
                'search_read',
                [
                    [
                        ['workflow_id','=',this.pageInfo.workflow_id]
                    ],
                    ["id","name","start_date","exp_end"],
                    0,1,null
                ]
            )
            console.log(this.page_data)
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