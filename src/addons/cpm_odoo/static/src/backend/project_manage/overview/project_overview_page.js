/** @odoo-module **/ 
import { GanttDisplay, ItemList, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { session } from "@web/session";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, isInGroup, joinM2MDatas, categorizeDate} from "../../components/component_utils";
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";

export class ProjectOverviewPage extends Component {
    static template = "cpm_odoo.ProjectOverviewPage";

    static formatDate = formatDate
    static isInGroup = isInGroup
    static categorizeDate = categorizeDate

    setup(){

        this.orm = useService("orm")
        this.action = useService("action")

        onWillStart(async ()=>{
            this.state_data = {
                project_info:null,
                recent_tasks:[],
                statistics:{},
                investor_list:[1,2,3,4],
                issue_list:[]
            }
            await this.loadData()
        })
    }

    async loadData(){
        this.state_data.project_info = (await this.orm.call(
            "cpm_odoo.root_project",
            "search_read",
            [
                [
                    ["id",'=',this.props.context_data.project_id]
                ]
            ],
            [],
            0,1,""
        ))[0]

        await joinM2MDatas([this.state_data.project_info],this.orm,["head_manager_ids","cpm_odoo.human_res_staff",["id",'name']])
    
        let recent_tasks = await this.orm.call(
            "cpm_odoo.planning_task",
            "act_get_active_tasks",
            [
                [
                    ['workflow_id.planning_id.project_id.id','=',this.props.context_data.project_id]
                ],
                0,
                ['id','name','workflow_id','start_date','exp_end','priority']
            ]
        )
        this.state_data.recent_tasks = recent_tasks
        
        let total_task_count = await this.orm.call(
            "cpm_odoo.planning_workflow",
            "read_group",
            [
                [
                    ['planning_id','=',this.props.context_data.planning_id]
                ],
                ['active_task_count:sum'],
                ['planning_id'],
                0,0,[],true
            ]
        )

        total_task_count = total_task_count[0].active_task_count?total_task_count[0].active_task_count:1
        
        let completed_task_count = await this.orm.call(
            "cpm_odoo.planning_workflow",
            "read_group",
            [
                [
                    ['planning_id','=',this.props.context_data.planning_id]
                ],
                ['completed_task_count:sum'],
                ['planning_id'],
                0,0,[],true
            ]
        )

        completed_task_count = completed_task_count[0].completed_task_count?completed_task_count[0].completed_task_count:0


        
        let project_progress = ((completed_task_count/(total_task_count>0?total_task_count:1)) * 100).toFixed(1);
        
        this.state_data.statistics = {
            total_task_count:total_task_count?total_task_count:0,
            completed_task_count:completed_task_count?completed_task_count:0,
            project_progress:project_progress
        }
    }

    async act_edit_project(){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Edit Project Info',
            res_model: 'cpm_odoo.root_project',  // Model name
            res_id:this.props.context_data.project_id,
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
        });
    }
}