/** @odoo-module **/
import { GanttDisplay, ItemList, SearchBar} from "../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime} from "../components/component_utils";
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";


export class CompletedTasksViewUI extends Component{
    static page_name="CompletedTasksViewUI"
    static template="cpm_odoo.CompletedTasksViewUI"

    static formatDate = formatDate

    setup(){
        this.page_data = useState({
            completed_tasks: [],
            verified_tasks: []
        })

        this.orm=useService("orm")
        this.action=useService("action")

        this.loadData()
    }
    
    async loadData(){
        // const today = new Date().toISOString().split('T')[0];
        this.page_data.completed_tasks = await this.orm.call(
            "cpm_odoo.planning_task",
            "act_get_completed_tasks",
            [
                [
                    ['assigned_staff_ids.staff_id.id','=',this.props.context_data.staff_id]
                ]
            ]
        )

        this.page_data.verified_tasks = await this.orm.call(
            "cpm_odoo.planning_task",
            "act_get_verified_tasks",
            [
                [
                    ['assigned_staff_ids.staff_id.id','=',this.props.context_data.staff_id]
                ]
            ]
        )
    }

    act_view_task(task_id){
        storePageInfo(`assigned_task_detail_view`,{
            'task_id':task_id
        })

        moveToPage("assigned_task_detail_view",null)
    }
}