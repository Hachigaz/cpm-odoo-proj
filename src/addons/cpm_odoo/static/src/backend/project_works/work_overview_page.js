/** @odoo-module **/
import { GanttDisplay, ItemList, SearchBar} from "../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime} from "../components/component_utils";
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";


export class WorkOverviewPage extends Component{
    static template="cpm_odoo.WorkOverviewPage"

    static formatDate = formatDate

    setup(){
        this.page_data = useState({
            recent_active_tasks : [],
            expiring_tasks: [],
            expired_tasks: []
        })

        this.orm=useService("orm")
        this.action=useService("action")

        this.loadData()
    }
    
    async loadData(){
        const today = new Date().toISOString().split('T')[0];
        let started_task_list= await this.orm.call(
            "cpm_odoo.planning_task",
            "act_get_active_tasks",
            [
                [
                    ['assigned_staff_ids','in',this.props.context_data.staff_id]
                ]
            ]
        )

        this.page_data.expiring_tasks = await this.orm.call(
            "cpm_odoo.planning_task",
            "act_get_expiring_tasks",
            [
                [
                    ['assigned_staff_ids','in',this.props.context_data.staff_id]
                ]
            ]
        )

        this.page_data.upcoming_tasks = await this.orm.call(
            "cpm_odoo.planning_task",
            "act_get_upcoming_tasks",
            [
                [
                    ['assigned_staff_ids','in',this.props.context_data.staff_id]
                ]
            ]
        )

        this.page_data.expired_tasks = await this.orm.call(
            "cpm_odoo.planning_task",
            "act_get_expired_tasks",
            [
                [
                    ['assigned_staff_ids','in',this.props.context_data.staff_id]
                ]
            ]
        )
    }

    act_view_task(task_id){

    }
}