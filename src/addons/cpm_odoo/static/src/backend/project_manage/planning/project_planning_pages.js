/** @odoo-module **/
import { GanttDisplay, ItemList, SearchBar} from "../../components/components";
import { DocumentSetItemList } from "../../doc_mgmt/document_mgmt";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, joinM2MDatas, formatSnakeStr, isInGroup, isInGroup2} from "../../components/component_utils";
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";
import { formatCurrency } from "../finance/components";

class PlanningOverview extends Component {
    static page_name = "PlanningOverview"
    static template = "cpm_odoo.PlanningOverview";
    setup(){
        this.page_info = useState({
            in_drafts:[],
            in_draft_count:0,
            active_workflows:[],
            active_workflow_count:0,
            finished_workflows:[],
            finished_workflow_count:0
        })

        onMounted(() => {

        });

        this.orm=useService('orm')
        this.action=useService('action')

        this.loadData()
    }

    async loadData(){
        this.page_info.in_drafts = await this.orm.call(
            "cpm_odoo.planning_workflow",
            "search_read",
            [
                [
                    ["planning_id","=",this.props.context_data.planning_id],
                    ["workflow_status","=","draft"]
                ],
                [],
                0,6,
                "name asc"
            ]
        )

        this.page_info.in_draft_count = await this.orm.call(
            "cpm_odoo.planning_workflow",
            "search_count",
            [
                [
                    ["planning_id","=",this.props.context_data.planning_id],
                    ["workflow_status","=","draft"]
                ]
            ]
        )
        
        this.page_info.active_workflows = await this.orm.call(
            "cpm_odoo.planning_workflow",
            "search_read",
            [
                [
                    ["planning_id","=",this.props.context_data.planning_id],
                    ["workflow_status","=","active"]
                ],
                [],
                0,6,
                "name asc"
            ]
        )

        this.page_info.active_workflow_count = await this.orm.call(
            "cpm_odoo.planning_workflow",
            "search_count",
            [
                [
                    ["planning_id","=",this.props.context_data.planning_id],
                    ["workflow_status","=","active"]
                ]
            ]
        )
        
        this.page_info.finished_workflows = await this.orm.call(
            "cpm_odoo.planning_workflow",
            "search_read",
            [
                [
                    ["planning_id","=",this.props.context_data.planning_id],
                    ["workflow_status","=","finished"]
                ],
                [],
                0,6,
                "name asc"
            ]
        )

        this.page_info.finished_workflow_count = await this.orm.call(
            "cpm_odoo.planning_workflow",
            "search_count",
            [
                [
                    ["planning_id","=",this.props.context_data.planning_id],
                    ["workflow_status","=","finished"]
                ]
            ]
        )
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

class PlanningWorkflowList extends Component{
    static template = "cpm_odoo.PlanningWorkflowList";

    formatDate = formatDate
    static formatSnakeStr = formatSnakeStr

    setup(){
        onWillStart(()=>{
            
        })

        this.action=useService('action')
    }

    async act_edit_general_info(workflow_id){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Workflow - Edit Info',
            res_model: 'cpm_odoo.planning_workflow',
            view_mode: 'form',
            res_id:workflow_id,
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_field': 'value' },
        });
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
        
        onWillStart(()=>{
            this.loadPage()
        })

        onMounted(()=>{
            
        })

        this.action=useService('action')
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

    async act_add_new_workflow(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Create New Workflow',
            res_model: 'cpm_odoo.planning_workflow',
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_planning_id': parseInt(this.props.context_data.planning_id) },
        });
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

    static formatDate = formatDate
    static formatSnakeStr = formatSnakeStr

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

        this.overview_page_data = useState({
            task_list:[]
        })

        this.action = useService('action')
        

        onWillStart(async ()=>{
            await this.loadData()
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
                ["id","name","start_date","exp_end","workflow_status","task_count","unassigned_task_count","active_task_count","completed_task_count","verified_task_count"],
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
                ["id","name","description","start_date","exp_end","assigned_staff_count","assigned_contractor_count",'task_status',"depends_on"],
                0,null,null
            ]
        )

        await this.loadOverviewPageData()
    }

    async loadOverviewPageData(){
        this.overview_page_data.task_list = [...this.page_data.task_list].splice(0,6)
        

        this.overview_page_data.workflow_progress_val = ((this.page_data.workflow_info.verified_task_count / (this.page_data.workflow_info.task_count>0?this.page_data.workflow_info.task_count:1)) * 100);
        this.overview_page_data.workflow_progress = ((this.page_data.workflow_info.verified_task_count / (this.page_data.workflow_info.task_count>0?this.page_data.workflow_info.task_count:1)) * 100).toFixed(1);

        // console.log(this.page_data.workflow_info,this.overview_page_data.workflow_progress) 
    }

    async act_create_new_task(){
        const result = await this.props.context_data.orm.call(
            "cpm_odoo.planning_task",
            "act_create_task",
            [this.pageInfo.workflow_id]
        )
        this.action.doAction(result)
        // await this.props.context_data.action.doAction({
        //     type: 'ir.actions.act_window',
        //     name: 'Create New Task',
        //     res_model: 'cpm_odoo.planning_task',
        //     view_mode: 'form',
        //     views: [[false, 'form']],
        //     target: 'new',
        //     context: { 'default_workflow_id': this.pageInfo.workflow_id },
        // });
    }

    async act_submit_workflow(){
        if(!confirm("Submit workflow?")){
            return
        }
        const result = await this.props.context_data.orm.call(
            "cpm_odoo.planning_workflow",
            "mark_active",
            [this.pageInfo.workflow_id]
        )

        if(result){
            window.location.reload()
        }
    }

    async act_edit_general_info(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Workflow - Edit Info',
            res_model: 'cpm_odoo.planning_workflow',
            view_mode: 'form',
            res_id:this.page_data.workflow_info.id,
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_field': 'value' },
        });
    }
}



//=============================================================
// Manage Task Component
//=============================================================
class PlanningStaffList extends ItemList{
    static template = "cpm_odoo.PlanningStaffList"
    static components = {
        SearchBar
    }

    setup(){
        // console.log(this.props.extra_domain)
        super.init()

        this.page_data.model_name = "cpm_odoo.human_res_staff"
        this.page_data.column_list = []//columns to get from model
        this.page_data.order_by_str = "department_id asc,name asc"
        this.page_data.item_display_count=24
        this.page_data.page_display_count=7
        
        this.search_filter.search_bar.cols=["name"]
        
        super.setup()

        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])
    }

    async append_to_list(item_list){
        let result = await isInGroup2(item_list.map(obj=>obj.id),'cpm_gr.project_head_mem_gr',this.orm)
        for (const [idx,item] of item_list.entries()){
            let val = result.find(obj=>obj.staff_id===item.id)
            item_list[idx].mem_role = val.is_in_group?"Head Member":"Member"
        }
    }

    async act_assign_task_head_member(staff_id){
        let result = this.orm.call(
            "cpm_odoo.planning_task",
            "act_assign_task_head_member",
            [
                this.props.task_info.id,
                [staff_id]
            ]
        )

        if(result){
            window.location.reload()
        }
    }

    async act_unassign_task_head_member(staff_id){
        let result = this.orm.call(
            "cpm_odoo.planning_task",
            "act_unassign_task_head_member",
            [
                this.props.task_info.id,
                [staff_id]
            ]
        )

        if(result){
            window.location.reload()
        }
    }
}

class PlanningContractorList extends ItemList{
    static template = "cpm_odoo.PlanningContractorList"
    static components = {
        SearchBar
    }


    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.planning_task_assign_contractor"
        this.page_data.column_list = []//columns to get from model
        this.page_data.order_by_str = ""
        this.page_data.join_cols = [
            ['contractor_id','cpm_odoo.stakeholders_contractor',["id","name","description"]]
        ]
        this.page_data.item_display_count=24
        this.page_data.page_display_count=7
        
        this.search_filter.search_bar.cols=["name"]
        this.action=useService('action')
        super.setup()

        useEffect(()=>{
            this.page_data.extra_domain = [["task_id","=",this.props.task_info.id]]
            this.act_setup_list()
        },()=>[this.props.task_info.assigned_contractor_ids])
    }

    async act_attach_contract(contractor_assign_id){
        let view_id = await this.orm.call(
            'ir.ui.view',
            'search_read',
            [
                [
                    ['name','=','cpm_odoo.planning_task_assign_contractor_attach_contract']
                ],
                ['id','name','xml_id'],
                0,1,""
            ]
        )

        view_id = view_id[0].id
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Attach Contract',
            res_model: 'cpm_odoo.planning_task_assign_contractor',
            view_mode: 'form',
            res_id:contractor_assign_id,
            views: [[view_id, 'form']],
            target: 'new',
            context:{project_id:this.props.context_data.project_id}
        });
    }

    async act_view_contract(contract_id){
        await this.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_set_detail',
            context: {document_set_id:contract_id}
        });
    }

    async act_change_contract(task_asgn_id){
        let view_id = await this.orm.call(
            'ir.ui.view',
            'search_read',
            [
                [
                    ['name','=','cpm_odoo.planning_task_assign_contractor_attach_contract']
                ],
                ['id','name','xml_id'],
                0,1,""
            ]
        )

        view_id = view_id[0].id
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Change Contract Set',
            res_model: 'cpm_odoo.planning_task_assign_contractor',
            view_mode: 'form',
            res_id:task_asgn_id,
            views: [[view_id, 'form']],
            target: 'new',
            context:{project_id:this.props.context_data.project_id}
        });
    }
}

class PlanningStaffAssignPanel extends ItemList{
    static template = "cpm_odoo.PlanningStaffAssignPanel";
    static components = {
        SearchBar
    }

    
    setup(){
        super.init()


        this.page_data.model_name = "cpm_odoo.human_res_staff"
        this.page_data.column_list = []//columns to get from model
        this.page_data.order_by_str = "department_id asc,first_name asc,last_name asc"
        this.page_data.item_display_count=24
        this.page_data.page_display_count=7
        this.search_filter.search_bar.cols=["name"]


        this.props.asgn_act.load = null
        this.props.asgn_act.save = this.act_save
        this.props.asgn_act.cancel = this.act_cancel_all
        this.props.asgn_act.inst = this
        
        this.cmp_root = useRef('cmp-root')
        
        super.setup()
        this.assigned_staff_ids = this.props.task_info.assigned_staff_ids.map(obj=>obj.staff_id[0])
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
        
        this.act_flip_btn_state(card_el)
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
        
        this.act_flip_btn_state(card_el)
    }

    async act_save(inst){
        if(inst.assign_actions.length>0 || inst.cancel_actions.length > 0){``
            // let actions = []
            // inst.assign_actions.forEach((staff_id)=>{
            //     actions.push([4,staff_id])
            // })

            // inst.cancel_actions.forEach((staff_id)=>{
            //     actions.push([3,staff_id])
            // })

            // const result = await (inst.props.context_data.orm.call(
            //     'cpm_odoo.planning_task',
            //     'write',
            //     [
            //         [inst.props.task_info.id],
            //         {
            //             "assigned_staff_ids":actions
            //         }
            //     ]
            // ))

            await (inst.props.context_data.orm.call(
                'cpm_odoo.planning_task',
                'act_assign_staffs_to_task',
                [
                    parseInt(inst.props.task_info.id),
                    inst.assign_actions
                ]
            ))

            await (inst.props.context_data.orm.call(
                'cpm_odoo.planning_task',
                'act_unassign_staffs_to_task',
                [
                    parseInt(inst.props.task_info.id),
                    inst.cancel_actions
                ]
            ))

            inst.act_reset(inst)
            window.location.reload()
        }
    }

    async act_cancel_all(inst){
        inst.assign_actions.forEach((id)=>{
            let card_el = inst.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${id}`)
        
            inst.act_flip_btn_state(card_el)
        })

        inst.cancel_actions.forEach((id)=>{
            let card_el = inst.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${id}`)
        
            inst.act_flip_btn_state(card_el)
        })

        inst.act_reset(inst)
    }

    async act_reset(inst){

        inst.assign_actions = []
        inst.cancel_actions = []
    }

    act_flip_btn_state(card_el){
        card_el.querySelector(".options .assign-act").classList.toggle('d-none')
        card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
        card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
        card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
        card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
        card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
    }
}


class PlanningContractorAssignPanel extends ItemList{
    static template = "cpm_odoo.PlanningContractorAssignPanel";
    static components = {
        SearchBar
    }

    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.stakeholders_contractor"
        this.page_data.column_list = []//columns to get from model
        this.page_data.order_by_str = "category_id asc,name asc"
        this.page_data.item_display_count=24
        this.page_data.page_display_count=7
        
        this.search_filter.search_bar.cols=["name"]

        useEffect(()=>{
            this.assigned_contractors_ids = this.props.task_info.assigned_contractor_ids.map(obj=>obj.contractor_id[0])
            this.act_setup_list()
        },()=>[this.props.task_info.assigned_contractor_ids])

        this.props.asgn_act.load = null
        this.props.asgn_act.save = this.act_save
        this.props.asgn_act.cancel = this.act_cancel_all
        this.props.asgn_act.inst = this
        
        this.cmp_root = useRef('cmp-root')
        super.setup()
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
        
        this.act_flip_btn_state(card_el)
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
            
        this.act_flip_btn_state(card_el)
    }

    async act_save(inst){
        if(inst.assign_actions.length>0 || inst.cancel_actions.length > 0){
            // let actions = []
            // inst.assign_actions.forEach((contractor_id)=>{
            //     actions.push([4,contractor_id])
            // })

            // inst.cancel_actions.forEach((contractor_id)=>{
            //     actions.push([3,contractor_id])
            // })

            // await (inst.props.context_data.orm.call(
            //     'cpm_odoo.planning_task',
            //     'write',
            //     [
            //         [inst.props.task_info.id],
            //         {
            //             "assigned_contractor_ids":actions
            //         }
            //     ]
            // ))
            
            await (inst.props.context_data.orm.call(
                'cpm_odoo.planning_task',
                'act_assign_contractors_to_task',
                [
                    parseInt(inst.props.task_info.id),
                    inst.assign_actions
                ]
            ))

            await (inst.props.context_data.orm.call(
                'cpm_odoo.planning_task',
                'act_unassign_contractors_to_task',
                [
                    parseInt(inst.props.task_info.id),
                    inst.cancel_actions
                ]
            ))

            inst.act_reset(inst)
            window.location.reload()
        }
    }

    async act_cancel_all(inst){
        inst.assign_actions.forEach((id)=>{
            let card_el = inst.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${id}`)
            
            inst.act_flip_btn_state(card_el)
        })

        inst.cancel_actions.forEach((id)=>{
            let card_el = inst.cmp_root.el.querySelector(`.staff-card-list#assign-list #staff-${id}`)
            
            inst.act_flip_btn_state(card_el)
        })

        inst.act_reset(inst)
    }

    act_flip_btn_state(card_el){
        card_el.querySelector(".options .assign-act").classList.toggle('d-none')
        card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeIn')
        card_el.querySelector(".options .assign-act").classList.toggle('animate__fadeOut')
        card_el.querySelector(".options .cancel-act").classList.toggle('d-none')
        card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeIn')
        card_el.querySelector(".options .cancel-act").classList.toggle('animate__fadeOut')
    }

    async act_reset(inst){
        inst.assign_actions = []
        inst.cancel_actions = []
    }
}

class PlanningTaskAttachedDocumentsPanel extends Component{
    static template = "cpm_odoo.PlanningTaskAttachedDocumentsPanel";
    static components={
        DocumentSetItemList
    }
    

    setup(){
        this.doc_set_item_list = useState({
            extra_domain : []
        })

        this.orm = useService("orm")

        this.cmp_root = useRef('cmp-root')

        

        useEffect(()=>{
            if(this.props.task_info.attached_document_ids){
                this.doc_set_item_list.extra_domain = [["id","in",Array.from(this.props.task_info.attached_document_ids)]]
            }
        },()=>[this.props.task_info])
    }

    attached_doc_ids = []

    async act_attach_document(doc_id){
        let card_el = this.cmp_root.el.querySelector(`.attach-card-list #doc-${doc_id}`)
        this.act_flip_btn_state(card_el)

        this.attached_doc_ids.push(doc_id)
        if(this.removed_doc_ids.includes(doc_id)){
            let index = this.removed_doc_ids.indexOf(doc_id);
            if (index !== -1) {
                this.removed_doc_ids.splice(index, 1);
            }                
        }

    }

    removed_doc_ids = []

    async act_remove_document(doc_id){
        let card_el = this.cmp_root.el.querySelector(`.attach-card-list #doc-${doc_id}`)
        this.act_flip_btn_state(card_el)

        this.removed_doc_ids.push(doc_id)
        if(this.attached_doc_ids.includes(doc_id)){
            let index = this.attached_doc_ids.indexOf(doc_id);
            if (index !== -1) {
                this.attached_doc_ids.splice(index, 1);
            }                
        }
    }

    async act_save(){
        if(this.removed_doc_ids.length>0 || this.attached_doc_ids.length > 0){``
            let actions = []
            this.attached_doc_ids.forEach((id)=>{
                actions.push([4,id])
            })

            this.removed_doc_ids.forEach((id)=>{
                actions.push([3,id])
            })

            const result = await (this.orm.call(
                'cpm_odoo.planning_task',
                'write',
                [
                    [this.props.task_info.id],
                    {
                        "attached_document_ids":actions
                    }
                ]
            ))

            this.act_cancel()
            window.location.reload()
        }
    }

    async act_cancel(){
        this.attached_doc_ids = []
        this.removed_doc_ids = []

        this.act_reset_btns()
    }

    act_reset_btns(){
        this.attached_doc_ids.forEach((id)=>{
            let card_el = this.cmp_root.querySelector(`.attach-card-list #doc-${id}`)
            this.act_flip_btn_state(card_el)
        })

        this.removed_doc_ids.forEach((id)=>{
            let card_el = this.cmp_root.querySelector(`.attach-card-list #doc-${id}`)
            this.act_flip_btn_state(card_el)
        })
    }

    act_flip_btn_state(card_el){
        card_el.querySelector(".options .attach-act").classList.toggle('d-none')
        card_el.querySelector(".options .attach-act").classList.toggle('animate__fadeIn')
        card_el.querySelector(".options .attach-act").classList.toggle('animate__fadeOut')
        card_el.querySelector(".options .remove-act").classList.toggle('d-none')
        card_el.querySelector(".options .remove-act").classList.toggle('animate__fadeIn')
        card_el.querySelector(".options .remove-act").classList.toggle('animate__fadeOut')
    }
}

class PlanningTaskExpenseList extends ItemList{
    static template = "cpm_odoo.PlanningTaskExpenseList"
    static components = {
        SearchBar
    }

    static formatDateTime=formatDateTime
    static formatCurrency = formatCurrency
    

    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.planning_task_expense"
        this.page_data.column_list = ["id","title","description","amount","category_id","date_created","created_by","expense_type","status",'cur_id']
        this.page_data.order_by_str = "date_created desc, title asc"
        this.page_data.join_cols = [
            ['category_id','cpm_odoo.finance_expense_category'],
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ]
        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])
        this.state_info = useState({
            can_delete:true
        })
        super.setup()
    }
}

class PlanningTaskExpensePanel extends Component{
    static template = "cpm_odoo.PlanningTaskExpensePanel";
    static components = {
        PlanningTaskExpenseList
    }

    setup(){
        this.orm=useService('orm')
        this.action= useService('action')

        this.state_data = useState({
            extra_domain:[]
        })
    }

    async act_add_task_expense(){
        const result = await this.orm.call(
            "cpm_odoo.planning_task",
            "create_new_expense",
            [
                this.props.task_info.id
            ]
        )
        this.action.doAction(result)
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
        PlanningTaskAttachedDocumentsPanel,
        PlanningTaskExpensePanel
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
                assigned_staff_ids:[],
                assigned_contractor_ids:[]
            }
        })
        

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

        onWillStart(async ()=>{
            await this.loadData()
        })

        onMounted(()=>{
            if(this.pageInfo.currentTab){
                let el = document.querySelector(`.task-tabs #${this.pageInfo.currentTab}-btn`).click();
            }
        })
    }
    

    async loadData(){
        let task_info = (await this.props.context_data.orm.call(
            'cpm_odoo.planning_task',
            'search_read',
            [
                [
                    ['id','=',this.pageInfo.task_id]
                ],
                ["id","name","start_date","exp_end","task_status","assigned_staff_ids","assigned_contractor_ids","attached_document_ids"],
                0,1,null
            ]
        ))

        await joinM2MDatas(
            task_info,this.props.context_data.orm,['assigned_contractor_ids','cpm_odoo.planning_task_assign_contractor',[]]
        )

        await joinM2MDatas(
            task_info,this.props.context_data.orm,['assigned_staff_ids','cpm_odoo.planning_task_assign_staff',[]]
        )
        
        this.page_data.task_info= task_info[0]
        if(!this.page_data.task_info){
            moveToPage(false,"workflow")
        }
        
        this.assigned_staff_extra_domain = [['id','in',this.page_data.task_info.assigned_staff_ids.map(obj=>obj.staff_id[0])]]
    }

    async act_edit_task_info(){
        // this.action.doAction({
        //     type: 'ir.actions.act_window',
        //     name: 'Document Set - Info',
        //     res_model: 'cpm_odoo.documents_document_set',  // Replace with the model name, e.g., 'res.partner'
        //     res_id: this.context.document_set_id,  // ID of the record you want to edit
        //     views: [[false, 'form']],  // Open the form view for editing
        //     target: 'new',  // Open in a new window, you can also use 'current' to open in the same window
        //     context:{
        //         action_name:"Edit Info"
        //     }
        // })
        await this.props.context_data.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Task - Edit Info',
            res_model: 'cpm_odoo.planning_task',
            view_mode: 'form',
            res_id:this.page_data.task_info.id,
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_workflow_id': this.page_data.task_info.workflow_id },
        });
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
export class ProjectPlanningPage extends Component {
    static page_name = "ProjectPlanningPage"
    static template = "cpm_odoo.ProjectPlanningPage";
    static components = {
        PlanningOverview,
        PlanningWorkflows,
        PlanningDrafts,
        PlanningUnassignedTasks
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
            id: "manage_workflow",
            name:"Manage Workflow",
            page:PlanningManageWorkflow,
            group_id:"cpm_manage_project_plans",
            disabled:getPageInfo(PlanningManageWorkflow.page_name)?false:true},
        {
            id: "manage_task",
            name:"Manage Task",
            page:PlanningManageTask,
            group_id:"cpm_manage_project_plans",
            disabled:getPageInfo(PlanningManageTask.page_name)?false:true
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