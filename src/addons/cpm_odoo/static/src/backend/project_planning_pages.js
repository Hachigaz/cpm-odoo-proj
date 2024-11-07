/** @odoo-module **/
import { GanttDisplay } from "./components";
import { DocumentManagementTab } from "./project_planning/document_mgmt";

odoo.define(
    'cpm_modules.project_planning_pages', 
    [
        "@odoo/owl",
        "@web/core/utils/hooks",
        "cpm_modules.component_utils"
    ], 
    function (require) {
    'use strict';

    const { Component, onWillStart, onMounted, useEffect, useState, useRef} = require("@odoo/owl");
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
            this.search_bar_el = useRef('search_bar')
            
            this.state_data = useState({
                task_list:this.props.page_data.task_list
            })

            onWillStart(()=>{

            })

            onMounted(()=>{
                this.bind_keys()
            })

            useEffect(
                () => {
                    this.state_data.task_list = this.props.page_data.task_list
                }, () => [this.props.page_data.task_list]
            )
        }

        bind_keys(){
            this.search_bar_el.el.addEventListener("keydown", 
                (event) => {
                    if (event.key === "Enter") {
                        this.act_search();
                    }
                }
            );
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

        async act_search(){
            let kw = this.search_bar_el.el.value
            if(kw){
                let keywords = kw.split(" ")

                this.state_data.task_list = this.props.page_data.task_list.filter((item) =>
                    keywords.some((keyword) =>
                        item.name.includes(keyword)
                    )
                );
            }
            else{
                this.state_data.task_list = this.props.page_data.task_list
            }
        }
    }

    
    class PlanningTaskGraph extends GanttDisplay{
        setup(){
            super.setup()
        }

        setup_graph(){
            gantt.config.columns = [
                {name: "text", label: "Task Name", width: "*"},
                {name: "start_date", label: "Start Date", align: "center", width: 100},
                {name: "_end_date", label: "Exp. End Date", align: "center", width: 100 }
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
    class ItemListManager{
        filter_options={
            search_bar:{
                el:undefined,
                search_cols:[]
            }
        }
        filter_cols=[]

        disp_item_list = []
        org_item_list = []

        //called on mounted
        bind_keys(){
            if(this.filter_options.search_bar.el){
                this.filter_options.search_bar.el.el.addEventListener("keydown", 
                    (event) => {
                        if (event.key === "Enter") {
                            this.act_search();
                        }
                    }
                );
            }
        }
        async act_load(){
            let item_list = this.org_item_list
            //filter by search keyword
            if(this.search_kw){
                let keywords = kw.split(" ")

                this.item_list = this.org_item_list.filter((item) =>
                    keywords.some((keyword) =>{
                            is_avail = false
                            this.filter_options.search_bar.search_cols.forEach((col)=>{
                                is_avail|=item[col].includes(keyword)
                            })
                            return is_avail
                        }
                    )
                );
            }

            //filter by others
            this.disp_item_list = item_list
        }
        //called on buttons
        async act_search(){
            this.search_kw = this.search_bar.el.el.value
            this.act_load()
        }

        async act_filter(){

        }
    }

    class PlanningStaffList extends Component{
        static template = "cpm_odoo.PlanningStaffList"
        itemList = new ItemListManager()
        

        setup(){
            this.state_data = useState({
                staff_list:[]
            })
            this.itemList.filter_options={
                search_bar:{
                    el:useRef('search-bar'),
                    search_cols:['first_name','last_name']
                }
            }
            useEffect(
                () => {
                    this.itemList.org_item_list = this.props.staff_list
                    this.itemList.act_load()
                    this.state_data.staff_list = this.itemList.disp_item_list
                }, () => [this.props.staff_list]
            )
            onMounted(()=>{
                // this.itemList.bind_keys()
            })
        }
    }

    class PlanningContractorList extends Component{
        static template = "cpm_odoo.PlanningContractorList"
        itemList = new ItemListManager()
        

        setup(){
            this.state_data = useState({
                contractor_list:[]
            })
            this.itemList.filter_options={
                search_bar:{
                    el:useRef('search-bar'),
                    search_cols:['first_name','last_name']
                }
            }
            useEffect(
                () => {
                    this.itemList.org_item_list = this.props.contractor_list
                    this.itemList.act_load()
                    this.state_data.contractor_list = this.itemList.disp_item_list
                }, () => [this.props.contractor_list]
            )
            onMounted(()=>{
                // this.itemList.bind_keys()
            })
        }
    }
    
    class PlanningStaffAssignPanel extends Component{
        static template = "cpm_odoo.PlanningStaffAssignPanel";
        
        setup(){
            this.state_data = useState({
                staff_list:[]
            })

            this.assigned_staff_ids = this.props.task_info

            this.loadData(this)
            this.cmp_root = useRef('cmp-root')


            this.props.asgn_act.load = this.loadData
            this.props.asgn_act.save = this.act_save
            this.props.asgn_act.cancel = this.act_cancel_all
            this.props.asgn_act.inst = this
        }

        async loadData(inst){
            inst.state_data.staff_list = await inst.props.context_data.orm.call(
                'cpm_odoo.human_res_staff',
                'search_read',
                [
                    [
                        
                    ],
                    [],
                    // ["id","first_name","last_name","department_id"],
                    0,21,null
                ]
            )
        }

        assign_actions = []
        cancel_actions = []

        async act_assign(staff_id){
            this.assign_actions.push(staff_id)
            if(this.cancel_actions.includes(staff_id)){
                let index = this.cancel_actions.indexOf(staff_id);
                if (index !== -1) {
                    this.cancel_actions.splice(index, 1);
                }                
            }

            let card_el = this.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${staff_id}`)

            card_el.querySelector(".options .assign-act").classList.toggle('d-none')
            card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
            card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
            card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
            card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
            card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
        }

        async act_cancel(staff_id){
            this.cancel_actions.push(staff_id)
            if(this.assign_actions.includes(staff_id)){
                let index = this.assign_actions.indexOf(staff_id);
                if (index !== -1) {
                    this.assign_actions.splice(index, 1);
                }                
            }
            
            let card_el = this.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${staff_id}`)

            card_el.querySelector(".options .assign-act").classList.toggle('d-none')
            card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
            card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
            card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
            card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
            card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
        }

        async act_save(inst){
            if(inst.assign_actions.length>0 || inst.cancel_actions.length > 0){``
                let actions = []
                inst.assign_actions.forEach((staff_id)=>{
                    actions.push([4,staff_id])
                })
    
                inst.cancel_actions.forEach((staff_id)=>{
                    actions.push([3,staff_id])
                })

                const result = await (inst.props.context_data.orm.call(
                    'cpm_odoo.planning_task',
                    'write',
                    [
                        [inst.props.task_info.id],
                        {
                            "assigned_staff_ids":actions
                        }
                    ]
                ))
    
                inst.act_reset(inst)
                window.location.reload()
            }
        }

        async act_cancel_all(inst){
            inst.assign_actions.forEach((id)=>{
                let card_el = inst.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${id}`)

                card_el.querySelector(".options .assign-act").classList.toggle('d-none')
                card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
                card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
                card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
                card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
                card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
            })

            inst.cancel_actions.forEach((id)=>{
                let card_el = inst.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${id}`)

                card_el.querySelector(".options .assign-act").classList.toggle('d-none')
                card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
                card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
                card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
                card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
                card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
            })

            inst.act_reset(inst)
        }

        async act_reset(inst){

            inst.assign_actions = []
            inst.cancel_actions = []
        }
    }

    
    class PlanningContractorAssignPanel extends Component{
        static template = "cpm_odoo.PlanningContractorAssignPanel";
        
        setup(){
            this.state_data = useState({
                contractor_list:[]
            })

            this.assigned_contractor_ids = this.props.task_info

            this.loadData(this)
            this.cmp_root = useRef('cmp-root')

            this.props.asgn_act.load = this.loadData
            this.props.asgn_act.save = this.act_save
            this.props.asgn_act.cancel = this.act_cancel_all
            this.props.asgn_act.inst = this
        }

        async loadData(inst){
            inst.state_data.contractor_list = await inst.props.context_data.orm.call(
                'cpm_odoo.stakeholders_contractor',
                'search_read',
                [
                    [
                        
                    ],
                    [],
                    // ["id","first_name","last_name","department_id"],
                    0,21,null
                ]
            )
        }

        assign_actions = []
        cancel_actions = []

        async act_assign(contractor_id){
            this.assign_actions.push(contractor_id)
            if(this.cancel_actions.includes(contractor_id)){
                let index = this.cancel_actions.indexOf(contractor_id);
                if (index !== -1) {
                    this.cancel_actions.splice(index, 1);
                }                
            }

            let card_el = this.cmp_root.el.querySelector(`.contractor-card-list#assign-list #contractor-${contractor_id}`)
            
            card_el.querySelector(".options .assign-act").classList.toggle('d-none')
            card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
            card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
            card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
            card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
            card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
        }

        async act_cancel(contractor_id){
            this.cancel_actions.push(contractor_id)
            if(this.assign_actions.includes(contractor_id)){
                let index = this.assign_actions.indexOf(contractor_id);
                if (index !== -1) {
                    this.assign_actions.splice(index, 1);
                }                
            }
            
            let card_el = this.cmp_root.el.querySelector(`.contractor-card-list#assign-list #contractor-${contractor_id}`)

            card_el.querySelector(".options .assign-act").classList.toggle('d-none')
            card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
            card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
            card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
            card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
            card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
        }

        async act_save(inst){
            if(inst.assign_actions.length>0 || inst.cancel_actions.length > 0){
                let actions = []
                inst.assign_actions.forEach((contractor_id)=>{
                    actions.push([4,contractor_id])
                })
    
                inst.cancel_actions.forEach((contractor_id)=>{
                    actions.push([3,contractor_id])
                })

                const result = await (inst.props.context_data.orm.call(
                    'cpm_odoo.planning_task',
                    'write',
                    [
                        [inst.props.task_info.id],
                        {
                            "assigned_contractor_ids":actions
                        }
                    ]
                ))
    
                inst.act_reset(inst)
                window.location.reload()
            }
        }

        async act_cancel_all(inst){
            inst.assign_actions.forEach((id)=>{
                let card_el = inst.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${id}`)

                card_el.querySelector(".options .assign-act").classList.toggle('d-none')
                card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
                card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
                card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
                card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
                card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
            })

            inst.cancel_actions.forEach((id)=>{
                let card_el = inst.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${id}`)

                card_el.querySelector(".options .assign-act").classList.toggle('d-none')
                card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
                card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
                card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
                card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
                card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
            })

            inst.act_reset(inst)
        }

        async act_reset(inst){
            inst.assign_actions = []
            inst.cancel_actions = []
        }
    }

    class PlanningAttachedDocumentsPanel extends Component{
        static template = "cpm_odoo.PlanningAttachedDocumentsPanel";

        setup(){

        }
    }

    class PlanningManageTask extends Component{
        static page_name = "PlanningManageTask"
        static template = "cpm_odoo.PlanningManageTask";
        static components = {
            PlanningStaffList,
            PlanningContractorList,
            PlanningStaffAssignPanel,
            PlanningContractorAssignPanel,
            PlanningAttachedDocumentsPanel
        }

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

                },
                assigned_staff_list:[],
                assigned_contractor_list:[]
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

            this.staff_asgn_act = useState({
                load:undefined,
                save:undefined,
                cancel:undefined
            })
            
            this.contractor_asgn_act = useState({
                load:undefined,
                save:undefined,
                cancel:undefined
            })

            onWillStart(()=>{

            })

            onMounted(()=>{
                if(this.pageInfo.currentTab){
                    let el = document.querySelector(`.task-tabs #${this.pageInfo.currentTab}-btn`).click();
                }
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
                    ["id","name","start_date","exp_end","task_status","assigned_staff_ids","assigned_contractor_ids"],
                    0,1,null
                ]
            ))[0]
            if(!this.page_data.task_info){
                moveToPage(false,"workflow")
            }

            
            this.page_data.assigned_staff_list = await this.props.context_data.orm.call(
                'cpm_odoo.human_res_staff',
                'read',
                [
                    this.page_data.task_info.assigned_staff_ids  
                ]
            )

            
            this.page_data.assigned_contractor_list = await this.props.context_data.orm.call(
                'cpm_odoo.stakeholders_contractor',
                'read',
                [
                    this.page_data.task_info.assigned_contractor_ids  
                ]
            )

            // this.page_data.assigned_contractor_list = await this.props.context_data.orm.call(
            //     'cpm_odoo.planning_task',
            //     'search_read',
            //     [
            //         [
            //             ['id','=',this.pageInfo.task_id]
            //         ],
            //         ["id","name","start_date","exp_end","task_status"],
            //         0,1,null
            //     ]
            // )
        }

        async _do_action(action,params){
            let result = await this.props.context_data.rpc(
                action,
                params
            )

            window.location.href=result
        }

        act_save_tab(tab_name){
            let pageInfo = this.pageInfo
            pageInfo.currentTab=tab_name
            storePageInfo(
                PlanningManageTask.page_name,
                pageInfo
            )
        }
    }

    



    //=============================================================
    // Root Component
    //=============================================================    
    class ProjectPlanningPage extends Component {
        static page_name = "ProjectPlanningPage"
        static template = "cpm_odoo.ProjectPlanningPage";
        static components = {
            PlanningOverview,
            PlanningWorkflows,
            PlanningDrafts,
            PlanningUnassignedTasks,
            DocumentManagementTab
        }
        
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
                id: "documents",
                name:"Project Documents",
                page:DocumentManagementTab,
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