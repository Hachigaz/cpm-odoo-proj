/** @odoo-module **/
import { ItemList, SearchBar} from "../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo, joinDatas, joinM2MDatas, formatSnakeStr} from "../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";
import { DocumentSetItemList } from "../doc_mgmt/document_mgmt";

export class AssignedTaskDetailView extends Component{
    static page_name="assigned_task_detail_view"
    static template="cpm_odoo.AssignedTaskDetailView"
    static components = {
        DocumentSetItemList
    }

    static formatSnakeStr = formatSnakeStr
    static formatDate = formatDate
    static formatDateTime = formatDateTime
    setup(){
        this.pageInfo = getPageInfo("assigned_task_detail_view")
        if(!this.pageInfo){
            moveToPage("work_overview_page")
        }
    


        this.orm = useService("orm")
        this.action = useService("action")
        this.comment_text_area = useRef("comment-text-area")

        this.page_data = {
            task_id:this.pageInfo.task_id,
            task_info:null,
            checklist:[],
            history_log:[],
            comments:[]
        }

        onWillStart(async ()=>{
            await this.loadData()
        })

        onMounted(()=>{
            if(this.pageInfo.current_tab){
                this.show_tab(this.pageInfo.current_tab)
            }
            else{
                this.show_tab("subtasks")
            }
        })

        onWillDestroy(()=>{
            // clearPageInfo(this.constructor.page_name)
        })
    }

    show_tab(name){
        if(this.pageInfo.current_tab){
            let btn_el = document.querySelector(`#task-detail-tabs #${this.pageInfo.current_tab}-tab`)
            btn_el.classList.remove("active")
            let el = document.querySelector(`#task-detail-tabs #${this.pageInfo.current_tab}`)
            el.classList.remove("show")
            el.classList.remove("active")
        }

        let btn_el = document.querySelector(`#task-detail-tabs #${name}-tab`)
        btn_el.classList.add("active")
        let el = document.querySelector(`#task-detail-tabs #${name}`)
        el.classList.add("show")
        el.classList.add("active")
        this.pageInfo.current_tab = name
        storePageInfo(this.constructor.page_name,this.pageInfo)
    }

    async loadData(){
        let task_info = await this.orm.call(
            "cpm_odoo.planning_task",
            "search_read",
            [
                [
                    ["id",'=',this.page_data.task_id]
                ],
                [],
                0,1,""
            ]
        )

        task_info=task_info[0]

        // if(!task_info){
        //     moveToPage("work_overview_page")
        // }

        this.page_data.task_info=task_info

        await this.load_checklist()
        await this.load_history_log()
        await this.load_comments()
    }

    async load_checklist(){
        let checklist = await this.orm.call(
            "cpm_odoo.task_checklist_item",
            'search_read',
            [
                [
                    ["task_id",'=',this.page_data.task_id]
                ],
                ['title','description','assigned_contractors','assigned_staffs','task_id','is_completed','due_date'],
                0,0,"is_completed desc"
            ]
        )

        // joinM2MDatas(checklist,this.orm,['assigned_staffs','cpm_odoo.human_res_staff',['id','name']])
        // joinM2MDatas(checklist,this.orm,['assigned_contractors','cpm_odoo.stakeholders_contractor',['id','name']])

        this.page_data.checklist=checklist.length>0?checklist:[]
    }

    async act_add_checklist_item(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'New Checklist Item',
            res_model: 'cpm_odoo.task_checklist_item',
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{
                'default_task_id':this.page_data.task_id
            }
        });
    }

    async mark_completed(id){
        if(confirm("Mark as completed?")){
            let result = await this.orm.call(
                "cpm_odoo.task_checklist_item",
                "mark_completed",
                [
                    id
                ]
            )
            if(result){
                window.location.reload()
            }
        }
    }

    async mark_reset(id){
        if(confirm("Unmark Completed?")){
            let result = await this.orm.call(
                "cpm_odoo.task_checklist_item",
                "mark_reset",
                [
                    id
                ]
            )
            if(result){
                window.location.reload()
            }
        }
    }

    async act_delete_checklist_item(id){
        if(confirm("Delete checklist item?")){
            let result = await this.orm.call(
                "cpm_odoo.task_checklist_item",
                "unlink",
                [
                    id
                ]
            )
            if(result){
                window.location.reload()
            }
        }
    }

    async load_history_log(){
        let history_log = await this.orm.call(
            "cpm_odoo.task_history_log",
            'search_read',
            [
                [
                    ["task_id",'=',this.page_data.task_id]
                ],
                [],
                0,0,"date_logged desc"
            ]
        )

        this.page_data.history_log=history_log?history_log:[]
    }

    async act_create_staff_leave(){
        let result = await this.orm.call(
            "cpm_odoo.risk_mgmt_issue",
            "act_create_staff_leave",
            [
                this.page_data.task_info.id
            ]
        )
        
        if(result){
            this.action.doAction(result)
        }
    }

    async act_create_task_issue(){
        console.log(this.page_data.task_info.project_id)
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Issue',
            res_model: 'cpm_odoo.risk_mgmt_issue',
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{
                'default_task_id':this.page_data.task_id,
                'default_project_id':this.page_data.task_info.project_id[0]
            }
        });
    }


    async load_comments(){
        let comments = await this.orm.call(
            "cpm_odoo.planning_task_comment",
            'search_read',
            [
                [
                    ["task_id",'=',this.page_data.task_id]
                ],
                [],
                0,0,"date_created desc"
            ]
        )

        this.page_data.comments=comments?comments:[]
    }

    async act_add_comment(){
        let text = this.comment_text_area.el.value
        if(text){
            if(confirm("Post Comment?")){
                let result = await this.orm.call(
                    "cpm_odoo.planning_task_comment",
                    "create",
                    [
                        {
                            "task_id":this.page_data.task_id,
                            "comment":text
                        }
                    ]
                )
                if(result){
                    window.location.reload()
                }
            }
        }
        else{
            this.comment_text_area.el.focus()
        }
    }
}
