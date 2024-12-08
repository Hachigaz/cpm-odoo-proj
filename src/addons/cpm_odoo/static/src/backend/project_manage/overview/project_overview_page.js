/** @odoo-module **/ 
import { GanttDisplay, ItemList, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { session } from "@web/session";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, isInGroup, joinM2MDatas, categorizeDate, joinDatas} from "../../components/component_utils";
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";
import { formatCurrency } from "../finance/components";

export class ProjectOverviewPage extends Component {
    static template = "cpm_odoo.ProjectOverviewPage";

    static formatDate = formatDate
    static isInGroup = isInGroup
    static categorizeDate = categorizeDate
    static formatCurrency = formatCurrency

    setup(){

        this.orm = useService("orm")
        this.action = useService("action")

        onWillStart(async ()=>{
            this.state_data = {
                project_info:null,
                recent_tasks:[],
                statistics:{},
                investor_list:[],
                investor_count:0,
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
                ['active_task_count:sum','completed_task_count:sum','verified_task_count:sum'],
                ['planning_id'],
                0,0,[],true
            ]
        )

        if(total_task_count.length>0){
            total_task_count = total_task_count[0]
            let active_task_count = total_task_count.active_task_count
            active_task_count = active_task_count?active_task_count:0
    
            let completed_task_count = total_task_count.completed_task_count
            completed_task_count = completed_task_count?completed_task_count:0
    
            let verified_task_count = total_task_count.verified_task_count
            verified_task_count = verified_task_count?verified_task_count:0
            
            let overdue_task_count = total_task_count.overdue_task_count + total_task_count.overdue_verified_task_count
            overdue_task_count = overdue_task_count?overdue_task_count:0
            
            total_task_count = active_task_count+completed_task_count+verified_task_count
    
    
            
            let project_progress = ((verified_task_count/(total_task_count>0?total_task_count:1)) * 100).toFixed(1);
            
            this.state_data.statistics = {
                total_task_count:total_task_count,
                active_task_count:active_task_count,
                completed_task_count:completed_task_count,
                verified_task_count:verified_task_count,
                project_progress:project_progress,
                overdue_task_count:overdue_task_count
            }
        }
        else{
            this.state_data.statistics = {
                total_task_count:0,
                active_task_count:0,
                completed_task_count:0,
                verified_task_count:0,
                project_progress:0,
                overdue_task_count:0
            }
        }

        let investor_ids = (await this.orm.call(
            "cpm_odoo.root_project",
            "search_read",
            [
                [
                    ['id','=',this.props.context_data.project_id]
                ],
                ['id',"investor_ids"],
                0,1,[]
            ]
        ))[0].investor_ids

        let dis_inv_ids = investor_ids.slice(0,3)

        let investor_list = await this.orm.call(
            "cpm_odoo.stakeholders_investor",
            "search_read",
            [
                [
                    ['id','in',dis_inv_ids]
                ],
                ['id',"name"],
                0,3,[]
            ]
        )
        
        let total_invests = await this.orm.call(
            "cpm_odoo.project_investor_investment_record",
            "search_read",
            [
                [   
                    ['project_finance_id','=',this.props.context_data.finance_id],
                    ['investor_id','in',dis_inv_ids]
                ],
                ['id',"cur_id","total_investments","investor_id"],
                0,3,[]
            ]
        )

        await joinDatas(total_invests,this.orm,[
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ])


        investor_list.forEach((arr,idx)=>{
            let total_invest = total_invests.find(item=>item.investor_id[0]===arr.id)
            investor_list[idx].investments=total_invest?total_invest:null
        })

        this.state_data.investor_list = investor_list
        this.state_data.investor_count = investor_ids.length



        let issue_list = await this.orm.call(
            "cpm_odoo.risk_mgmt_issue",
            "search_read",
            [
                [
                    ["project_id",'=',this.props.context_data.project_id],
                    ['level','!=','minor'],
                    ['status','!=','resolved']
                ],
                [],
                0,8,"created_at asc"
            ]
        )

        this.state_data.issue_list = issue_list
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